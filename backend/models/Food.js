const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    quantity: {
      type: String,
      required: [true, 'Quantity is required'],
      trim: true,
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    preparedAt: {
      type: Date,
      default: null,
    },
    foodType: {
      type: String,
      enum: ['cooked', 'raw', 'packaged', 'bakery', 'fruits-vegetables', 'dairy', 'other'],
      default: 'other',
    },
    storageMethod: {
      type: String,
      enum: ['refrigerated', 'frozen', 'room temperature', 'hot-held', 'other'],
      default: 'room temperature',
    },
    currentStorageTemperature: {
      type: Number,
      default: null,
    },
    packagingCondition: {
      type: String,
      enum: ['sealed', 'properly covered', 'partially damaged', 'open'],
      default: 'sealed',
    },
    foodAppearance: {
      type: String,
      enum: ['normal', 'slightly changed', 'clearly abnormal'],
      default: 'normal',
    },
    odor: {
      type: String,
      enum: ['normal', 'slightly unusual', 'unusual'],
      default: 'normal',
    },
    contaminationRisk: {
      type: String,
      enum: ['none', 'possible', 'known'],
      default: 'none',
    },
    hygiene: {
      type: String,
      enum: ['good', 'acceptable', 'poor'],
      default: 'good',
    },
    location: {
      address: {
        type: String,
        trim: true,
      },
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
    status: {
      type: String,
      enum: ['available', 'requested', 'completed', 'expired'],
      default: 'available',
    },
    category: {
      type: String,
      enum: ['cooked', 'raw', 'packaged', 'beverages', 'other'],
      default: 'other',
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodSafety: {
      score: { type: Number, default: 100, min: 0, max: 100 },
      status: { type: String, enum: ['SAFE', 'CAUTION', 'UNSAFE'], default: 'SAFE' },
      reasons: [{ type: String }],
      evaluatedAt: { type: Date, default: Date.now },
    },
    urgency: {
      score: { type: Number, default: 0, min: 0, max: 100 },
      level: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], default: 'LOW' },
      evaluatedAt: { type: Date, default: Date.now },
    },
    distance: {
      km: { type: Number, default: null },
      score: { type: Number, default: 0, min: 0, max: 100 },
      evaluatedAt: { type: Date, default: Date.now },
    },
    priority: {
      score: { type: Number, default: 0, min: 0, max: 100 },
      evaluatedAt: { type: Date, default: Date.now },
    },
    images: [{ type: String }],
  },
  { timestamps: true }
);

foodSchema.pre('validate', function validateFoodData(next) {
  if (this.preparedAt && this.expiryTime && new Date(this.preparedAt) > new Date(this.expiryTime)) {
    return next(new Error('Preparation time cannot be after the expiry time.'));
  }

  if (this.currentStorageTemperature !== null && this.currentStorageTemperature !== undefined && Number.isNaN(Number(this.currentStorageTemperature))) {
    return next(new Error('Current storage temperature must be numeric.'));
  }

  if (this.expiryTime && Number.isNaN(new Date(this.expiryTime).getTime())) {
    return next(new Error('Expiry time must be a valid date.'));
  }

  next();
});

// Index for geospatial queries and status filter
foodSchema.index({ 'location.lat': 1, 'location.lng': 1 });
foodSchema.index({ status: 1 });
foodSchema.index({ donor: 1 });

module.exports = mongoose.model('Food', foodSchema);
  