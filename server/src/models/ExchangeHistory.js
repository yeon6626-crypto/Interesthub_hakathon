const mongoose = require('mongoose');

const EXCHANGE_STATUS = ['PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED'];

const PAYBACK_SERVICE_NAMES = [
  'ChatGPT',
  'Claude',
  'Gemini',
  'Fastcampus',
  'Inflearn',
];

const exchangeHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    serviceName: {
      type: String,
      required: [true, 'serviceName is required'],
      trim: true,
      enum: {
        values: PAYBACK_SERVICE_NAMES,
        message: '지원하지 않는 환급 서비스입니다.',
      },
    },
    amount: {
      type: Number,
      required: [true, 'amount is required'],
      min: [1, '환급 금액은 1원 이상이어야 합니다.'],
    },
    diaCost: {
      type: Number,
      required: [true, 'diaCost is required'],
      min: [0, 'diaCost must be non-negative'],
    },
    status: {
      type: String,
      required: true,
      enum: EXCHANGE_STATUS,
      default: 'PENDING',
      index: true,
    },
    naverPayId: {
      type: String,
      trim: true,
      default: '',
    },
    adminNote: {
      type: String,
      trim: true,
      default: '',
    },
    processedAt: {
      type: Date,
      default: null,
    },
    processedBy: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

exchangeHistorySchema.index({ userId: 1, createdAt: -1 });
exchangeHistorySchema.index({ status: 1, createdAt: 1 });

const ExchangeHistory = mongoose.model('ExchangeHistory', exchangeHistorySchema);

module.exports = ExchangeHistory;
module.exports.EXCHANGE_STATUS = EXCHANGE_STATUS;
module.exports.PAYBACK_SERVICE_NAMES = PAYBACK_SERVICE_NAMES;
