import crypto from 'crypto';
import { store } from '../models/store.js';
import { hashPassword } from '../utils/auth.js';
import { sendOtpEmail } from '../utils/mailer.js';
import { broadcastRealtime } from '../utils/websocket.js';

/**
 * Replaces the Supabase Edge Function `create-user`:
 * Creates an account (student or faculty) with strict permission enforcement.
 */
export async function createUser(req, res) {
  try {
    const caller = req.user;
    const body = req.body;
    const { role } = body;

    if (role === 'admin') {
      return res.status(403).json({ error: 'Admin accounts cannot be self-provisioned' });
    }
    if (role === 'faculty' && caller.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create faculty accounts' });
    }
    if (role === 'student' && !['faculty', 'admin'].includes(caller.role)) {
      return res.status(403).json({ error: 'Only faculty or admins can register students' });
    }
    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const cleanEmail = body.email.trim().toLowerCase();
    const existing = await store.findUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const newUserId = crypto.randomUUID();
    const finalPassword = (body.password && typeof body.password === 'string' && body.password.trim())
      ? body.password.trim()
      : (crypto.randomBytes(16).toString('hex') + 'A1!');
    const hashedPassword = await hashPassword(finalPassword);

    await store.createUser({
      id: newUserId,
      email: cleanEmail,
      password: hashedPassword,
      role
    });

    if (role === 'student') {
      const existingRoll = await store.findStudentByRoll(body.roll_no);
      if (existingRoll) {
        // Rollback user
        await store.updateUser(newUserId, { deleted: true });
        return res.status(400).json({ error: 'A student with this roll number already exists' });
      }

      await store.createStudent({
        id: newUserId,
        userId: newUserId,
        name: body.name,
        roll_no: body.roll_no,
        branch: body.branch,
        year: Number(body.year),
        cgpa: body.cgpa ? Number(body.cgpa) : null,
        leetcode_handle: body.leetcode_handle || null
      });

      broadcastRealtime({ type: 'REALTIME_CHANGE', table: 'students', action: 'INSERT', record: { id: newUserId, name: body.name } });
    } else if (role === 'faculty') {
      await store.createFaculty({
        id: newUserId,
        userId: newUserId,
        name: body.name,
        department: body.department
      });
    }

    // Generate password setup OTP for the new user
    const otp = await store.createOtp(cleanEmail, 'account_setup');
    await sendOtpEmail(cleanEmail, otp.code, 'Account Setup');

    return res.status(201).json({
      success: true,
      userId: newUserId,
      message: `${role} account created successfully. A verification code has been dispatched.`,
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp.code })
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function listProfiles(req, res) {
  try {
    const users = await store.listUsers();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Replaces the Supabase RPC `admin_set_role`:
 * Admin only, prevents changing one's own role.
 */
export async function setRole(req, res) {
  try {
    const { target_id, new_role } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins may change roles' });
    }

    if (target_id === req.user.id) {
      return res.status(400).json({ error: 'Admins cannot change their own role' });
    }

    if (!['student', 'faculty', 'admin'].includes(new_role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const updated = await store.updateUser(target_id, { role: new_role });
    if (!updated) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    return res.json({ success: true, message: 'Role updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
