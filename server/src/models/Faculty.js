import mongoose from 'mongoose';

const FacultySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, ref: 'User' },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true }
  },
  { timestamps: true }
);

export const FacultyModel = mongoose.models.Faculty || mongoose.model('Faculty', FacultySchema);
