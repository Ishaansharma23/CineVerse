import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedMovie: null,
  selectedTheatre: null,
  selectedShow: null,
  selectedSeats: [],
  currentBooking: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    selectMovie: (state, action) => {
      state.selectedMovie = action.payload;
    },
    selectTheatre: (state, action) => {
      state.selectedTheatre = action.payload;
    },
    selectShow: (state, action) => {
      state.selectedShow = action.payload;
    },
    toggleSeatSelection: (state, action) => {
      const seat = action.payload;
      if (state.selectedSeats.includes(seat)) {
        state.selectedSeats = state.selectedSeats.filter((s) => s !== seat);
      } else {
        state.selectedSeats.push(seat);
      }
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    clearSeats: (state) => {
      state.selectedSeats = [];
    },
    clearBooking: (state) => {
      state.selectedMovie = null;
      state.selectedTheatre = null;
      state.selectedShow = null;
      state.selectedSeats = [];
      state.currentBooking = null;
    },
  },
});

export const { selectMovie, selectTheatre, selectShow, toggleSeatSelection, setCurrentBooking, clearSeats, clearBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
