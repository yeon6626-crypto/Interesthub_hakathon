const mongoose = require('mongoose');

const QUEST_TYPES = ['DAILY', 'WEEKLY'];

const questSchema = new mongoose.Schema(
  {
    questCode: {
      type: String,
      required: [true, 'questCode is required'],
      unique: true,
      trim: true,
    },
    questType: {
      type: String,
      required: [true, 'questType is required'],
      enum: QUEST_TYPES,
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },
    targetClass: {
      type: String,
      trim: true,
      default: 'ALL',
    },
    rewardExp: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardCoin: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Quest = mongoose.model('Quest', questSchema);

module.exports = Quest;
module.exports.QUEST_TYPES = QUEST_TYPES;
