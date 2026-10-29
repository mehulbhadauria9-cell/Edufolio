import { store } from '../models/store.js';
import { broadcastRealtime } from '../utils/websocket.js';
import { fetchLeetCodeProfile } from '../services/leetcodeService.js';

export async function listStudents(req, res) {
  try {
    const { search = '', branch = '', limit = 100 } = req.query;
    const students = await store.listStudents({ search, branch, limit });
    return res.json(students);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getStudentById(req, res) {
  try {
    const { id } = req.params;
    const student = await store.findStudentById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Replaces `guard_student_self_update` DB trigger:
 * Students may only update their avatar_url and leetcode_handle.
 * Staff/Admin may update other academic details.
 */
export async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const caller = req.user;

    const existing = await store.findStudentById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updates = {};

    if (caller.role === 'student') {
      if (caller.id !== existing.userId && caller.id !== existing.id) {
        return res.status(403).json({ error: 'Students can only edit their own profile' });
      }

      // Enforce trigger: only avatar and leetcode handle allowed
      if (req.body.avatar_url !== undefined) updates.avatar_url = req.body.avatar_url;
      if (req.body.leetcode_handle !== undefined) updates.leetcode_handle = req.body.leetcode_handle;
    } else if (['faculty', 'admin'].includes(caller.role)) {
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.roll_no !== undefined) updates.roll_no = req.body.roll_no;
      if (req.body.branch !== undefined) updates.branch = req.body.branch;
      if (req.body.year !== undefined) updates.year = Number(req.body.year);
      if (req.body.cgpa !== undefined) updates.cgpa = req.body.cgpa ? Number(req.body.cgpa) : null;
      if (req.body.leetcode_handle !== undefined) updates.leetcode_handle = req.body.leetcode_handle;
      if (req.body.avatar_url !== undefined) updates.avatar_url = req.body.avatar_url;
    } else {
      return res.status(403).json({ error: 'Unauthorized to update student' });
    }

    const updated = await store.updateStudent(id, updates);
    broadcastRealtime({ type: 'REALTIME_CHANGE', table: 'students', action: 'UPDATE', record: updated });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Syncs real live LeetCode statistics and awards verified milestone achievements.
 */
export async function syncLeetCode(req, res) {
  try {
    const { id } = req.params;
    const caller = req.user;

    const student = await store.findStudentById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (caller.role === 'student' && caller.id !== student.userId && caller.id !== student.id) {
      const callerUser = await store.findUserById(caller.id);
      const emailMatches = callerUser?.email && (
        student.email?.toLowerCase() === callerUser.email.toLowerCase() ||
        student.roll_no?.toLowerCase() === callerUser.email.toLowerCase()
      );
      if (!emailMatches) {
        return res.status(403).json({ error: 'Unauthorized to sync this student' });
      }
    }

    const handle = req.body.handle || student.leetcode_handle;
    if (!handle) {
      return res.status(400).json({ error: 'No LeetCode handle associated with this profile' });
    }

    // Query LeetCode directly without loopback HTTP call
    let stats;
    try {
      stats = await fetchLeetCodeProfile(handle, true);
    } catch (lcErr) {
      return res.status(404).json({ error: lcErr.message || `LeetCode profile for "${handle}" not found` });
    }

    const studentUpdates = { leetcode_handle: handle };
    if (!student.avatar_url && stats.avatar) {
      studentUpdates.avatar_url = stats.avatar;
    }
    await store.updateStudent(student.id, studentUpdates);

    // Auto-generate milestone achievements based on real stats
    const existingAchievements = await store.listAchievements(student.id);

    const milestones = [
      {
        title: `${stats.totalSolved}+ LeetCode Algorithmic Problems Solved`,
        description: `Verified accepted submissions across ${stats.easySolved} Easy, ${stats.mediumSolved} Medium, and ${stats.hardSolved} Hard algorithmic challenges on LeetCode.`,
        points: Math.min(300, Math.max(50, Math.floor(stats.totalSolved * 0.75))),
        domain: 'competitive_programming'
      }
    ];

    if (stats.ranking && stats.ranking > 0) {
      milestones.push({
        title: `LeetCode Contest Global Rank #${stats.ranking.toLocaleString()}`,
        description: `Secured competitive global standing on official LeetCode rating leaderboards with ${stats.reputation || 0} reputation points.`,
        points: stats.ranking < 200000 ? 200 : (stats.ranking < 500000 ? 150 : 100),
        domain: 'competitive_programming'
      });
    }

    if (stats.mediumSolved >= 50) {
      milestones.push({
        title: `${stats.mediumSolved}+ Medium Complexity Algorithmic Solutions`,
        description: `Demonstrated mastery over complex Trees, Dynamic Programming, Graphs, and Greedy problem solving.`,
        points: stats.mediumSolved >= 150 ? 150 : 100,
        domain: 'technical'
      });
    }

    if (stats.hardSolved >= 10) {
      milestones.push({
        title: `Hard Problem Solver: ${stats.hardSolved} Hard Problems Mastered`,
        description: `Conquered high-difficulty competitive programming challenges requiring advanced algorithmic insight.`,
        points: 150,
        domain: 'competitive_programming'
      });
    }

    let addedCount = 0;
    for (const m of milestones) {
      const alreadyHas = existingAchievements.some((ea) => ea.title === m.title || (ea.title.includes('LeetCode') && ea.title.includes(String(stats.totalSolved))));
      if (!alreadyHas) {
        await store.createAchievement({
          student_id: student.id,
          domain: m.domain,
          title: m.title,
          description: m.description,
          points: m.points,
          date_awarded: new Date().toISOString().slice(0, 10),
          created_by: caller.id
        });
        addedCount++;
      }
    }

    await store.recalcStudentPoints(student.id);
    const updatedStudent = await store.findStudentById(student.id);
    const updatedAchievements = await store.listAchievements(student.id);

    broadcastRealtime({ type: 'REALTIME_CHANGE', table: 'students', action: 'UPDATE', record: updatedStudent });
    broadcastRealtime({ type: 'REALTIME_CHANGE', table: 'achievements', action: 'INSERT', record: { student_id: student.id } });

    return res.json({
      success: true,
      stats,
      student: updatedStudent,
      achievements: updatedAchievements,
      addedMilestones: addedCount
    });
  } catch (err) {
    console.error('[SYNC LEETCODE ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Admin action to permanently delete a student, their achievements, and user account.
 */
export async function deleteStudent(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove students' });
    }

    const { id } = req.params;
    const student = await store.findStudentById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // 1. Delete associated achievements
    await store.deleteAchievementsByStudentId(student.id);

    // 2. Delete student record
    await store.deleteStudent(student.id);

    // 3. Delete user account if exists
    if (student.userId) {
      await store.deleteUser(student.userId);
    }

    // 4. Broadcast deletion to all realtime clients
    broadcastRealtime({ type: 'REALTIME_CHANGE', table: 'students', action: 'DELETE', record: { id: student.id } });
    broadcastRealtime({ type: 'REALTIME_CHANGE', table: 'achievements', action: 'DELETE', record: { student_id: student.id } });

    return res.json({
      success: true,
      message: `Student "${student.name}" and associated records removed successfully`
    });
  } catch (err) {
    console.error('[DELETE STUDENT ERROR]', err);
    return res.status(500).json({ error: err.message });
  }
}

