const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true, // String ke starting aur ending ke extra spaces hata do.
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // acha wo threatre k owner ko refer kr rha user collection mai 
      required: true,
    },

    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },

    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },

    amenities: [ // Theatre me available facilities.
      {
        type: String,
        trim: true,
      },
    ],

    screens: [ // screens array me actual Screen object store nahi hoga. 
    // Sirf uska _id store hoga.
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Screen',
      },
    ],

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'], // Ye validation hai.
      default: 'pending',
    },

    isActive: { // active threatres milenge
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Theatre', theatreSchema);// model name