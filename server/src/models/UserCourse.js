const mongoose = require('mongoose');

const PROGRESS_STATUS = ['LOCKED', 'AVAILABLE', 'COMPLETED'];

const userCourseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'courseId is required'],
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: PROGRESS_STATUS,
      default: 'LOCKED',
    },
  },
  {
    timestamps: true,
  }
);

userCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const UserCourse = mongoose.model('UserCourse', userCourseSchema);

module.exports = UserCourse;
module.exports.PROGRESS_STATUS = PROGRESS_STATUS;
