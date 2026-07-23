const {
  searchMovieTool,
  getMovieTheatresTool,
  searchAvailableDatesTool,
  searchShowTimesTool,
  getSeatLayoutTool,
  reserveSeatsTool,
} = require("./tools/backendTools");

const handleBookingWorkflow = async (state) => {
  const { movie, theatre, showDate, showTime, showId, seatCount, selectedSeats, userId, messages } = state;
  const lastUserMsg = (messages.filter((m) => m.role === "user").pop()?.content || "").toLowerCase().trim();

  if (lastUserMsg === "cancel" || lastUserMsg === "cancel booking" || lastUserMsg.includes("cancel booking")) {
    return {
      status: "BOOKING_CANCELLED",
      pendingStep: null,
      movie: null,
      theatre: null,
      showDate: null,
      showTime: null,
      showId: null,
      seatCount: null,
      selectedSeats: [],
      data: {
        message: "Booking cancelled.",
      },
    };
  }

  if (movie) {
    const movies = await searchMovieTool(movie);
    const matchedMovie = movies.length > 0 ? movies[0] : null;
    const movieId = matchedMovie ? matchedMovie._id : movie;
    const movieTitle = matchedMovie ? matchedMovie.title : movie;

    const movieTheatres = await getMovieTheatresTool(movieId);
    const theatreNames = movieTheatres.map((t) => t.name);

    if (theatreNames.length === 0) {
      return {
        status: "NO_THEATRES_FOUND",
        pendingStep: "SELECT_THEATRE",
        data: {
          searchedMovie: movieTitle,
          message: `Sorry, there are currently no active shows scheduled for ${movieTitle}.`,
        },
      };
    }

    let validTheatre = null;
    if (theatre) {
      const match = theatreNames.find(
        (t) =>
          t.toLowerCase().includes(theatre.toLowerCase()) ||
          theatre.toLowerCase().includes(t.toLowerCase())
      );
      if (match) {
        validTheatre = match;
      }
    }

    if (!validTheatre && (lastUserMsg.includes("continue") || lastUserMsg.includes("proceed") || lastUserMsg.includes("confirm"))) {
      if (theatreNames.length === 1) {
        validTheatre = theatreNames[0];
      }
    }

    if (theatre && !validTheatre) {
      const message =
        theatreNames.length === 1
          ? `Sorry, this movie is currently not available at ${theatre}. It is currently available only at ${theatreNames[0]}.`
          : `Sorry, this movie is currently not available at ${theatre}. It is available at: ${theatreNames.join(", ")}.`;

      return {
        status: "INVALID_THEATRE",
        pendingStep: "SELECT_THEATRE",
        theatre: null,
        data: {
          searchedMovie: movieTitle,
          theatres: theatreNames,
          invalidTheatre: theatre,
          message,
        },
      };
    }

    if (!validTheatre) {
      if (theatreNames.length === 1) {
        const singleTheatre = theatreNames[0];
        return {
          status: "CONFIRM_SINGLE_THEATRE",
          pendingStep: "CONFIRM_SINGLE_THEATRE",
          data: {
            searchedMovie: movieTitle,
            theatre: singleTheatre,
            theatres: [singleTheatre],
            message: `📍 ${singleTheatre}\nThis movie is available only at this theatre.\nWould you like to continue?`,
          },
        };
      }

      return {
        status: "SELECT_THEATRE",
        pendingStep: "SELECT_THEATRE",
        data: {
          searchedMovie: movieTitle,
          theatres: theatreNames,
          message: `Select a cinema showing ${movieTitle}.`,
        },
      };
    }

    const currentTheatre = validTheatre;

    if (!showDate) {
      const availableDates = await searchAvailableDatesTool(movieId, currentTheatre);

      return {
        status: "SELECT_DATE",
        pendingStep: "SELECT_DATE",
        theatre: currentTheatre,
        data: {
          movie: movieTitle,
          theatre: currentTheatre,
          availableDates,
        },
      };
    }

    const showTimeResult = await searchShowTimesTool(movieId, currentTheatre, showDate);
    const shows = Array.isArray(showTimeResult) ? showTimeResult : (showTimeResult.shows || []);

    console.log("[DEBUG] State Transition:", {
      beforeDate: state.showDate,
      mergedDate: showDate,
      theatre: currentTheatre,
      showsCount: shows.length,
      status: "SELECT_SHOWTIME",
    });

    if (showTimeResult && showTimeResult.todayEnded) {
      return {
        status: "SELECT_DATE",
        pendingStep: "SELECT_DATE",
        theatre: currentTheatre,
        showDate: null,
        data: {
          movie: movieTitle,
          theatre: currentTheatre,
          availableDates: showTimeResult.availableDates,
          message: `Today's shows have ended. Next available shows are on ${showTimeResult.nextAvailableDate?.displayDate || "tomorrow"}.`,
        },
      };
    }

    if (!showTime && !showId) {
      return {
        status: "SELECT_SHOWTIME",
        pendingStep: "SELECT_SHOWTIME",
        theatre: currentTheatre,
        data: {
          movie: movieTitle,
          theatre: currentTheatre,
          date: showDate,
          shows,
        },
      };
    }

    let targetShowId = showId;
    if (!targetShowId && shows && shows.length > 0) {
      const matchedShow = shows.find(
        (s) => s.startTime === showTime || s.startTime?.toLowerCase() === showTime?.toLowerCase()
      );
      targetShowId = matchedShow ? matchedShow._id : shows[0]._id;
    }

    if (!seatCount) {
      return {
        status: "SELECT_SEAT_COUNT",
        pendingStep: "SELECT_SEAT_COUNT",
        theatre: currentTheatre,
        showId: targetShowId,
        data: {
          movie: movieTitle,
          theatre: currentTheatre,
          date: showDate,
          showTime,
          showId: targetShowId,
          message: "How many seats would you like to book?",
        },
      };
    }

    if (Array.isArray(selectedSeats) && selectedSeats.length > 0 && targetShowId && userId) {
      const reservation = await reserveSeatsTool(userId, targetShowId, seatCount, selectedSeats);
      if (reservation.success) {
        return {
          status: "RESERVED",
          pendingStep: "COMPLETED",
          theatre: currentTheatre,
          showId: targetShowId,
          data: {
            booking: reservation.booking,
            bookingId: reservation.booking._id ? reservation.booking._id.toString() : reservation.booking.bookingId,
            message: "Perfect! 🎉\n\nYour selected seats have been reserved temporarily.\n\nRedirecting you to the payment page...",
          },
        };
      } else {
        const layout = await getSeatLayoutTool(targetShowId);
        return {
          status: "SELECT_SEATS",
          pendingStep: "SELECT_SEATS",
          theatre: currentTheatre,
          showId: targetShowId,
          data: {
            showId: targetShowId,
            movie: movieTitle,
            theatre: currentTheatre,
            date: showDate,
            showTime,
            seatCount,
            seats: layout,
            message: reservation.message || "Selected seats could not be locked. Please select available seats.",
          },
        };
      }
    }

    if (targetShowId) {
      const layout = await getSeatLayoutTool(targetShowId);
      return {
        status: "SELECT_SEATS",
        pendingStep: "SELECT_SEATS",
        theatre: currentTheatre,
        showId: targetShowId,
        data: {
          showId: targetShowId,
          movie: movieTitle,
          theatre: currentTheatre,
          date: showDate,
          showTime,
          seatCount,
          seats: layout,
          message: `Please select ${seatCount} seat(s) below to continue.`,
        },
      };
    }
  }

  const movies = await searchMovieTool("");

  return {
    status: "SELECT_MOVIE",
    pendingStep: "SELECT_MOVIE",
    data: { movies },
  };
};

module.exports = {
  handleBookingWorkflow,
};
