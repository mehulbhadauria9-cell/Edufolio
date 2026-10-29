import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    name: { type: String, required: true, trim: true },
    roll_no: { type: String, required: true, unique: true, trim: true },
    branch: { type: String, required: true },
    year: { type: Number, required: true, min: 1, max: 5 },
    cgpa: { type: Number, min: 0, max: 10, default: null },
    leetcode_handle: { type: String, default: null },
    avatar_url: { type: String, default: null },
    total_points: { type: Number, default: 0, index: -1 }
  },
  { timestamps: true }
);

StudentSchema.index({ name: 'text', roll_no: 'text', branch: 'text' });

export const StudentModel = mongoose.models.Student || mongoose.model('Student', StudentSchema);
