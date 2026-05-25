const mongoose = require('mongoose');

const COURSE_TYPES = ['FOUNDATION', 'CORE', 'SPECIALIZATION'];

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'courseCode is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    majorCategory: {
      type: String,
      required: [true, 'majorCategory is required'],
      trim: true,
    },
    courseType: {
      type: String,
      required: [true, 'courseType is required'],
      enum: COURSE_TYPES,
    },
    academicYear: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
    },
    nameKo: {
      type: String,
      trim: true,
      default: '',
    },
    icon: {
      type: String,
      default: '📘',
      trim: true,
    },
    prerequisiteCode: {
      type: String,
      trim: true,
      default: null,
    },
    rewardExp: {
      type: Number,
      default: 0,
      min: 0,
    },
    rewardGold: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
module.exports.COURSE_TYPES = COURSE_TYPES;
