import mongoose from 'mongoose';

const revenueMasterSchema = new mongoose.Schema({
  pricePerView: {
    type: Number,
    required: [true, 'Price per view is required'],
    min: [0, 'Price per view cannot be negative'],
    default: 0.01
  },
  pricePerLike: {
    type: Number,
    required: [true, 'Price per like is required'],
    min: [0, 'Price per like cannot be negative'],
    default: 0.05
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: 'Standard pricing model'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    enum: ['standard', 'premium', 'promotional'],
    default: 'standard'
  },
  minimumPayout: {
    type: Number,
    default: 10,
    min: [0, 'Minimum payout cannot be negative']
  },
  maxEarningsPerDay: {
    type: Number,
    default: 1000,
    min: [0, 'Max earnings per day cannot be negative']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
revenueMasterSchema.index({ isActive: 1, effectiveFrom: -1 });
revenueMasterSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
revenueMasterSchema.index({ category: 1 });

// Virtual field for pricing display
revenueMasterSchema.virtual('pricingDisplay').get(function() {
  return `${this.currency} ${this.pricePerView}/view, ${this.currency} ${this.pricePerLike}/like`;
});

// Pre-save middleware to handle effective dates
revenueMasterSchema.pre('save', function(next) {
  // If this is being set as active, deactivate other active pricing models
  if (this.isActive && this.isNew) {
    // This will be handled in the controller to avoid circular updates
  }
  
  // Set effective to date for previous models when creating new one
  if (this.isNew && this.isActive) {
    this.effectiveFrom = new Date();
  }
  
  next();
});

// Static method to get current active pricing
revenueMasterSchema.statics.getCurrentPricing = function() {
  return this.findOne({
    isActive: true,
    effectiveFrom: { $lte: new Date() },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: new Date() } }
    ]
  }).sort({ effectiveFrom: -1 });
};

// Static method to get pricing for a specific date
revenueMasterSchema.statics.getPricingForDate = function(date) {
  return this.findOne({
    effectiveFrom: { $lte: date },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: date } }
    ]
  }).sort({ effectiveFrom: -1 });
};

// Method to calculate earnings for given metrics
revenueMasterSchema.methods.calculateEarnings = function(views, likes) {
  const viewEarnings = views * this.pricePerView;
  const likeEarnings = likes * this.pricePerLike;
  const totalEarnings = viewEarnings + likeEarnings;
  
  return {
    viewEarnings,
    likeEarnings,
    totalEarnings,
    currency: this.currency
  };
};

// Method to check if earnings exceed daily limit
revenueMasterSchema.methods.exceedsDailyLimit = function(currentDailyEarnings, additionalEarnings) {
  return (currentDailyEarnings + additionalEarnings) > this.maxEarningsPerDay;
};

const RevenueMaster = mongoose.model('RevenueMaster', revenueMasterSchema);

export default RevenueMaster;
