import { createContext, useContext, useState } from 'react';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [currentBooking, setCurrentBooking] = useState(null);

  const selectMovie = (movie) => {
    setSelectedMovie(movie);
    setSelectedTheatre(null);
    setSelectedShow(null);
    setSelectedSeats([]);
    setCurrentBooking(null);
  };

  const selectTheatre = (theatre) => {
    setSelectedTheatre(theatre);
    setSelectedShow(null);
    setSelectedSeats([]);
    setCurrentBooking(null);
  };

  const selectShow = (show) => {
    setSelectedShow(show);
    setSelectedSeats([]);
    setCurrentBooking(null);
  };

  const toggleSeat = (seatLabel) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatLabel)) {
        return prev.filter((s) => s !== seatLabel);
      } else {
        return [...prev, seatLabel];
      }
    });
  };

  const clearSeats = () => {
    setSelectedSeats([]);
  };

  const clearBooking = () => {
    setSelectedMovie(null);
    setSelectedTheatre(null);
    setSelectedShow(null);
    setSelectedSeats([]);
    setCurrentBooking(null);
  };

  const totalAmount = selectedShow ? selectedSeats.length * selectedShow.price : 0;

  return (
    <BookingContext.Provider
      value={{
        selectedMovie,
        selectedTheatre,
        selectedShow,
        selectedSeats,
        currentBooking,
        totalAmount,
        selectMovie,
        selectTheatre,
        selectShow,
        toggleSeat,
        clearSeats,
        clearBooking,
        setCurrentBooking,
        setSelectedSeats,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
