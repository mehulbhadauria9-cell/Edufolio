import jwt from 'jsonwebtoken';
import { store } from '../models/store.js';
import { hashPassword, comparePassword, generateToken, verifyToken, JWT_SECRET } from '../utils/auth.js';
import { sendResetLinkEmail } from '../utils/mailer.js';


export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await store.findUserByEmail(cleanEmail);
    if (!user && !cleanEmail.includes('@')) {
      user = await store.findUserByEmail(`${cleanEmail}@gmail.com`);
      if (!user) {
        user = await store.findUserByEmail(`${cleanEmail}@edufolio.edu`);
      }
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    let roleData = null;
    if (user.role === 'student') {
      roleData = await store.findStudentById(user.id);
    } else if (user.role === 'faculty') {
      roleData = await store.findFacultyById(user.id);
    }

    return res.json({
      token,
      session: {
        access_token: token,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        roleData
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Sends a password reset link to the user's email.
 */
export async function sendResetLink(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await store.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({
        error: `No account found for "${cleanEmail}". Registered demo accounts: student@edufolio.edu, faculty@edufolio.edu, admin@edufolio.edu`
      });
    }

    // Generate secure 1-hour reset token
    const resetToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: 'password_reset'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const clientOrigin = req.headers.origin || 'http://localhost:5173';
    const resetUrl = `${clientOrigin}/reset-password?token=${resetToken}`;

    await sendResetLinkEmail(user.email, resetUrl);

    return res.json({
      success: true,
      message: `A password reset link has been dispatched to ${user.email}.`,
      resetUrl // also available in response for convenience
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Validates a reset token from URL query params.
 */
export async function verifyResetToken(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
    }

    const user = await store.findUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      valid: true,
      email: user.email
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Sets a new password using a verified reset token.
 */
export async function resetPasswordWithToken(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'This password reset link is invalid or has expired.' });
    }

    const user = await store.findUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await store.updateUser(user.id, { password: hashedPassword });

    const sessionToken = generateToken({ ...user, password: hashedPassword });

    return res.json({
      success: true,
      message: 'Password reset successfully',
      session: {
        access_token: sessionToken,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updatePassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const hashedPassword = await hashPassword(password);
    await store.updateUser(req.user.id, { password: hashedPassword });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await store.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let roleData = null;
    if (user.role === 'student') {
      roleData = await store.findStudentById(user.id);
    } else if (user.role === 'faculty') {
      roleData = await store.findFacultyById(user.id);
    }

    return res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      roleData
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
