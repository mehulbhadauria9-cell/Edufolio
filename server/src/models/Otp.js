import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true, trim: true },
    purpose: { type: String, default: 'password_reset' },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false }
  },
  { timestamps: true }
);

OtpSchema.index({ email: 1, code: 1 });

export const OtpModel = mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
