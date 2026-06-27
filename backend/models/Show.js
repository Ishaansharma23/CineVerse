    const mongoose = require("mongoose");

    //** */ Kaunsi Movie Kaunsi Screen Kitne baje

    const showSchema = new mongoose.Schema({
    // Ye show kis movie ka hai?
    movie: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
        required: true,
    },
    // Ye show kis Audi (Screen) me chal raha hai?
    screen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Screen",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },  
    status: {
    type:String,
    enum:["scheduled","cancelled","completed"],
    default:"scheduled"

    },
    timestamps:true,
    });

    module.exports = mongoose.model("Show", showSchema);
