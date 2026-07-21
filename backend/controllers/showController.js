const Show = require("../models/Show");
const Movie = require("../models/Movie");
const Screen = require("../models/Screen");
const Theatre = require("../models/Theatre");

const createShow = async (req, res) => {
  try {
    const { movieId, screenId, date, startTime, endTime, price } = req.body;

    // Required fields check karo
    if (
      !movieId ||
      !screenId ||
      !date ||
      !startTime ||
      !endTime ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Validate Price
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Ticket price must be a valid positive amount",
      });
    }

    // Validate Date (must not be past)
    const showDate = new Date(date);
    if (isNaN(showDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid date format",
      });
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (showDate < today) {
      return res.status(400).json({
        success: false,
        message: "Show date cannot be in the past",
      });
    }

    // Validate Start Time & End Time
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message:
          "Start time and End time must be in HH:mm format (e.g., 14:30)",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be strictly after Start time",
      });
    }

    // Check karo movie exist karti hai ya nahi
    const movie = await Movie.findById(movieId); // as req body m ai hai naki param m isliye movieId likha h

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Check karo screen exist karti hai ya nahi
    const screen = await Screen.findById(screenId); // same

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: "Screen not found",
      });
    }

    // Screen ke through theatre find karo, screen model m theatre ka ref hai
    const theatre = await Theatre.findById(screen.theatre);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    // Check karo logged-in owner isi theatre ka owner hai ya nahi
    if (theatre.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to create show for this theatre",
      });
    }

    // *** main-> validation Same Audi me ek hi time par 2 movies nahi chal sakti.

    const existingShow = await Show.findOne({
      screen: screenId,
      date,
      startTime: { $lt: endTime }, // less than
      endTime: { $gt: startTime }, // greater than
      status: "scheduled",
    });

    if (existingShow) {
      return res.status(400).json({
        success: false,
        message: "This screen is already booked for the selected date and time",
      });
    }

    // Naya show create karo
    const show = await Show.create({
      movie: movieId,
      screen: screenId,
      date,
      startTime,
      endTime,
      price,
    });

    res.status(201).json({
      success: true,
      message: "Show created successfully",
      show,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all shows of a theatre (Owner only)
const getMyShows = async (req, res) => {
  try {
    // Route se theatre id lo
    const theatreId = req.params.theatreId;

    // Theatre find karo
    const theatre = await Theatre.findById(theatreId);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    // Check karo logged-in owner isi theatre ka owner hai ya nahi
    if (theatre.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view these shows",
      });
    }

    // Is theatre ki saari Audis (Screens) le aao.
    const screens = await Screen.find({
      theatre: theatreId,
      isActive: true,
    });

    // Ab sirf in Audis ki ids nikal lo.
    const screenIds = screens.map((screen) => screen._id);

    // In teeno Audis ke jitne bhi shows hain, sab le aao (scheduled status only).
    const shows = await Show.find({
      screen: { $in: screenIds },
      status: "scheduled",
    })
      .populate("movie") // Movie ka name, poster, rating etc
      .populate("screen"); // Screen number, Audi type etc

    res.status(200).json({
      success: true,
      message: "Shows fetched successfully",
      shows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single show by id
const getShowById = async (req, res) => {
  try {
    // URL se show id lo
    const showId = req.params.id;

    // Show find karo aur movie + screen details bhi bhejo
    const show = await Show.findById(showId)
      .populate("movie")
      .populate("screen");

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Show fetched successfully",
      show,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateShow = async (req, res) => {
  try {
    // URL se show id lo
    const showId = req.params.id;

    // Pehle show find karo
    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Show ke through screen find karo
    const screen = await Screen.findById(show.screen);

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: "Screen not found",
      });
    }

    // Screen ke through theatre find karo
    const theatre = await Theatre.findById(screen.theatre);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    // Check karo logged-in owner isi theatre ka owner hai ya nahi
    if (theatre.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this show",
      });
    }

    const { date, startTime, endTime, price, status } = req.body;

    // Agar frontend ne new timing nahi bheji to purani timing use karo
    const newStartTime = startTime || show.startTime;
    const newEndTime = endTime || show.endTime;

    // Sirf tab overlap check karo jab date ya timing change ho
    if (date || startTime || endTime) {
      const existingShow = await Show.findOne({
        _id: { $ne: showId }, // Jis show ko update kar raha hu usko ignore karo
        screen: show.screen, // Sirf isi Audi ke shows check karo
        date: date || show.date,
        startTime: { $lt: newEndTime },
        endTime: { $gt: newStartTime },
        status: "scheduled",
      });

      if (existingShow) {
        return res.status(400).json({
          success: false,
          message: "Another show is already scheduled during this time",
        });
      }
    }

    // Jo fields frontend se aayi hain sirf unhi ko update karo
    show.date = date || show.date;
    show.startTime = newStartTime;
    show.endTime = newEndTime;
    show.price = price || show.price;
    show.status = status || show.status;

    // Updated show database me save karo
    const updatedShow = await show.save();

    res.status(200).json({
      success: true,
      message: "Show updated successfully",
      show: updatedShow,
    });
  } catch (error) {
    console.log("Error updating show:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteShow = async (req, res) => {
  try {
    // URL se show id lo
    const showId = req.params.id;

    // Pehle show find karo
    const show = await Show.findById(showId);

    if (!show) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Show ke through screen find karo
    const screen = await Screen.findById(show.screen);

    if (!screen) {
      return res.status(404).json({
        success: false,
        message: "Screen not found",
      });
    }

    // Screen ke through theatre find karo
    const theatre = await Theatre.findById(screen.theatre);

    if (!theatre) {
      return res.status(404).json({
        success: false,
        message: "Theatre not found",
      });
    }

    // Check karo logged-in owner isi theatre ka owner hai ya nahi
    if (theatre.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this show",
      });
    }

    // Permanent delete nahi kar rahe.
    // Sirf show ko cancelled kar rahe hain (Soft Delete).
    // Isse booking history aur reports safe rehti hain.

    show.status = "cancelled";

    // Updated show database me save karo
    await show.save();

    res.status(200).json({
      success: true,
      message: "Show cancelled successfully",
    });
  } catch (error) {
    console.log("Error deleting show:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getShowsByMovie = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { date } = req.query;

    let query = {
      movie: movieId,
      status: "scheduled",
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const shows = await Show.find(query)
      .populate("movie")
      .populate({
        path: "screen",
        populate: {
          path: "theatre",
        },
      });

    res.status(200).json({
      success: true,
      message: "Shows fetched successfully",
      shows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createShow,
  getMyShows,
  getShowById,
  deleteShow,
  updateShow,
  getShowsByMovie,
};
