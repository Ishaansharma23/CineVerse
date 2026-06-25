const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
    movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Movie",
    required: true
    },
    screen:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Screen",
        required: true
    },
    date:{
        type: Date,
        required: true
    },
    showTime:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    seats:{
        type: Number,
        required: true
    }
})

module.exports = mongoose.model("show" , showSchema);