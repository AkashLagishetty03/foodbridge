const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: [true, 'Food listing is required'],
    },
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'NGO user is required'],
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    message: {
      type: String,
      trim: true,
      maxlength: [300, 'Message cannot exceed 300 characters'],
    },
    responseNote: {
      type: String,
      trim: true,
      maxlength: [300, 'Response note cannot exceed 300 characters'],
    },
    pickupTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent NGO from requesting the same food twice
requestSchema.index({ food: 1, ngo: 1 }, { unique: true });
requestSchema.index({ donor: 1, status: 1 });
requestSchema.index({ ngo: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
