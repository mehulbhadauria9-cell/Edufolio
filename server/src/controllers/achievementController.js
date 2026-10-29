import { store } from '../models/store.js';
import { broadcastRealtime } from '../utils/websocket.js';

const VALID_DOMAINS = ['competitive_programming', 'sports', 'cultural', 'academics', 'technical'];

export async function listAchievements(req, res) {
  try {
    const { student_id, domain } = req.query;
    const achievements = await store.listAchievements(student_id, domain);
    return res.json(achievements);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Replaces `on_achievement_change` DB trigger (`recalc_student_points`):
 * Automatically computes sum(points) and updates students.total_points.
 */
export async function createAchievement(req, res) {
  try {
    const { student_id, domain, title, description, points, date_awarded } = req.body;

    if (!['faculty', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized. Only faculty and admins can award achievements.' });
    }

    if (!student_id || !domain || !title || points === undefined) {
      return res.status(400).json({ error: 'student_id, domain, title, and points are required' });
    }

    if (!VALID_DOMAINS.includes(domain)) {
      return res.status(400).json({ error: `Invalid domain. Must be one of: ${VALID_DOMAINS.join(', ')}` });
    }

    const student = await store.findStudentById(student_id);
    if (!student) {
      return res.status(404).json({ error: 'Target student not found' });
    }

    const record = await store.createAchievement({
      student_id: student.id,
      domain,
      title,
      description,
      points: Number(points),
      date_awarded,
      created_by: req.user.id
    });

    const updatedStudent = await store.findStudentById(student.id);

    broadcastRealtime({ type: 'REALTIME_CHANGE', table: 'achievements', action: 'INSERT', record });
    broadcastRealtime({ type: 'REALTIME_CHANGE', table: 'students', action: 'UPDATE', record: updatedStudent });

    return res.status(201).json(record);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
