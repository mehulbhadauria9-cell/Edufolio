import { store } from '../models/store.js';

export async function getMetrics(req, res) {
  try {
    const students = await store.listStudents();
    const achievements = await store.listAchievements();

    const totalStudents = students.length;
    const totalAchievements = achievements.length;
    const topper = students.length > 0 ? students[0] : null;

    return res.json({
      totalStudents,
      totalAchievements,
      topper: topper ? { name: topper.name, total_points: topper.total_points || 0 } : null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
