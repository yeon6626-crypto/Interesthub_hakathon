const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'password is required'],
    },
    nickname: {
      type: String,
      required: [true, 'nickname is required'],
      unique: true,
      trim: true,
    },
    major: {
      type: String,
      default: 'School of Electronics Engineering',
      trim: true,
    },
    grade: {
      type: String,
      default: '1학년 1학기',
      trim: true,
    },
    targetClass: {
      type: String,
      default: 'Embedded Systems',
      trim: true,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    exp: {
      type: Number,
      default: 0,
      min: 0,
    },
    gold: {
      type: Number,
      default: 100,
      min: 0,
    },
    coin: {
      type: Number,
      default: 250,
      min: 0,
    },
    reputation: {
      type: Number,
      default: 0,
      min: 0,
    },
    courseProgressMigrated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function hashPasswordOnSave() {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.pre('findOneAndUpdate', async function hashPasswordOnUpdate() {
  const update = this.getUpdate();
  const password = update?.password ?? update?.$set?.password;

  if (!password) return;

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  if (update.$set) {
    update.$set.password = hashedPassword;
  } else {
    update.password = hashedPassword;
  }

  this.setUpdate(update);
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
