import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    student_id: { type: String, required: true, index: true },
    domain: {
      type: String,
      required: true,
      enum: ['competitive_programming', 'sports', 'cultural', 'academics', 'technical']
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    points: { type: Number, required: true, min: 0 },
    date_awarded: { type: String, required: true },
    created_by: { type: String, required: true }
  },
  { timestamps: true }
);

AchievementSchema.index({ student_id: 1, date_awarded: -1 });

export const AchievementModel = mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
