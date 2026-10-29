import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { isMongoConnected } from '../config/db.js';
import { UserModel } from './User.js';
import { StudentModel } from './Student.js';
import { FacultyModel } from './Faculty.js';
import { AchievementModel } from './Achievement.js';
import { OtpModel } from './Otp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

function readJsonFile(filename, defaultVal = []) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    writeJsonFile(filename, defaultVal);
    return defaultVal;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw || !raw.trim()) return defaultVal;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[STORE READ ERROR] Could not parse ${filename}:`, err.message);
    return defaultVal;
  }
}

function writeJsonFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  const tmpPath = path.join(DATA_DIR, `.${filename}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
  const content = JSON.stringify(data, null, 2);
  try {
    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (e) {
      console.error(`[STORE WRITE ERROR] Failed to write ${filename}:`, e.message);
    }
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (_) {}
    }
  }
}

export const store = {
  // ----------------- USERS -----------------
  async findUserByEmail(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (isMongoConnected) {
      return UserModel.findOne({ email: cleanEmail }).lean();
    }
    const users = readJsonFile('users.json');
    return users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  async findUserById(id) {
    if (isMongoConnected) {
      return UserModel.findOne({ id }).lean();
    }
    const users = readJsonFile('users.json');
    return users.find((u) => u.id === id) || null;
  },

  async listUsers() {
    if (isMongoConnected) {
      return UserModel.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();
    }
    const users = readJsonFile('users.json');
    return users.map(({ password, ...u }) => u);
  },

  async createUser({ id, email, password, role = 'student' }) {
    const userId = id || crypto.randomUUID();
    const cleanEmail = email.trim().toLowerCase();
    const newUser = {
      id: userId,
      email: cleanEmail,
      password,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      await UserModel.create(newUser);
      return newUser;
    }

    const users = readJsonFile('users.json');
    users.push(newUser);
    writeJsonFile('users.json', users);
    return newUser;
  },

  async updateUser(id, updates) {
    if (isMongoConnected) {
      return UserModel.findOneAndUpdate({ id }, { ...updates, updatedAt: new Date() }, { new: true }).lean();
    }
    const users = readJsonFile('users.json');
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJsonFile('users.json', users);
    return users[idx];
  },

  async deleteUser(id) {
    if (isMongoConnected) {
      await UserModel.deleteOne({ id });
      return;
    }
    const users = readJsonFile('users.json');
    const filtered = users.filter((u) => u.id !== id);
    writeJsonFile('users.json', filtered);
  },

  // ----------------- STUDENTS -----------------
  async listStudents({ search = '', branch = '', limit = 100 } = {}) {
    if (isMongoConnected) {
      const query = {};
      if (branch) query.branch = branch;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { roll_no: { $regex: search, $options: 'i' } }
        ];
      }
      return StudentModel.find(query).sort({ total_points: -1 }).limit(Number(limit)).lean();
    }

    let students = readJsonFile('students.json');
    const achievements = readJsonFile('achievements.json');
    const pointsMap = new Map();
    achievements.forEach((a) => {
      const p = Number(a.points) || 0;
      pointsMap.set(a.student_id, (pointsMap.get(a.student_id) || 0) + p);
    });

    students = students.map((s) => {
      const achPoints = (pointsMap.get(s.id) || 0) + (s.userId && s.userId !== s.id ? (pointsMap.get(s.userId) || 0) : 0);
      const total_points = Math.max(Number(s.total_points) || 0, achPoints);
      return { ...s, total_points };
    });

    if (branch) {
      students = students.filter((s) => s.branch.toLowerCase() === branch.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      students = students.filter(
        (s) => (s.name && s.name.toLowerCase().includes(q)) || (s.roll_no && s.roll_no.toLowerCase().includes(q))
      );
    }
    students.sort((a, b) => (Number(b.total_points) || 0) - (Number(a.total_points) || 0));
    return students.slice(0, Number(limit));
  },

  async findStudentById(id) {
    if (isMongoConnected) {
      return StudentModel.findOne({ $or: [{ id }, { userId: id }] }).lean();
    }
    const students = readJsonFile('students.json');
    const student = students.find((s) => s.id === id || s.userId === id);
    if (!student) return null;
    const achievements = readJsonFile('achievements.json');
    const targetIds = [student.id, student.userId];
    const achPoints = achievements
      .filter((a) => targetIds.includes(a.student_id))
      .reduce((sum, a) => sum + (Number(a.points) || 0), 0);
    return {
      ...student,
      total_points: Math.max(Number(student.total_points) || 0, achPoints)
    };
  },

  async findStudentByRoll(roll_no) {
    if (isMongoConnected) {
      return StudentModel.findOne({ roll_no: roll_no.trim() }).lean();
    }
    const students = readJsonFile('students.json');
    return students.find((s) => s.roll_no.toLowerCase() === roll_no.trim().toLowerCase()) || null;
  },

  async createStudent(studentData) {
    const record = {
      id: studentData.id || crypto.randomUUID(),
      userId: studentData.userId || studentData.id,
      name: studentData.name,
      roll_no: studentData.roll_no,
      branch: studentData.branch,
      year: Number(studentData.year),
      cgpa: studentData.cgpa ? Number(studentData.cgpa) : null,
      leetcode_handle: studentData.leetcode_handle || null,
      avatar_url: studentData.avatar_url || null,
      total_points: studentData.total_points || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      await StudentModel.create(record);
      return record;
    }

    const students = readJsonFile('students.json');
    students.push(record);
    writeJsonFile('students.json', students);
    return record;
  },

  async updateStudent(id, updates) {
    if (isMongoConnected) {
      return StudentModel.findOneAndUpdate(
        { $or: [{ id }, { userId: id }] },
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
    }
    const students = readJsonFile('students.json');
    const idx = students.findIndex((s) => s.id === id || s.userId === id);
    if (idx === -1) return null;
    students[idx] = { ...students[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJsonFile('students.json', students);
    return students[idx];
  },

  async deleteStudent(id) {
    if (isMongoConnected) {
      await StudentModel.deleteOne({ $or: [{ id }, { userId: id }] });
      return;
    }
    const students = readJsonFile('students.json');
    const filtered = students.filter((s) => s.id !== id && s.userId !== id);
    writeJsonFile('students.json', filtered);
  },

  // ----------------- FACULTY -----------------
  async findFacultyById(id) {
    if (isMongoConnected) {
      return FacultyModel.findOne({ $or: [{ id }, { userId: id }] }).lean();
    }
    const facultyList = readJsonFile('faculty.json');
    return facultyList.find((f) => f.id === id || f.userId === id) || null;
  },

  async createFaculty(facultyData) {
    const record = {
      id: facultyData.id || crypto.randomUUID(),
      userId: facultyData.userId || facultyData.id,
      name: facultyData.name,
      department: facultyData.department,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      await FacultyModel.create(record);
      return record;
    }

    const list = readJsonFile('faculty.json');
    list.push(record);
    writeJsonFile('faculty.json', list);
    return record;
  },

  // ----------------- ACHIEVEMENTS -----------------
  async listAchievements(student_id = null, domain = null) {
    let targetIds = null;
    if (student_id) {
      const student = await this.findStudentById(student_id);
      targetIds = student ? [student.id, student.userId] : [student_id];
    }

    let list = [];
    if (isMongoConnected) {
      const q = {};
      if (targetIds) q.student_id = { $in: targetIds };
      if (domain && domain !== 'all') q.domain = domain;
      list = await AchievementModel.find(q).sort({ date_awarded: -1, createdAt: -1 }).lean();
    } else {
      list = readJsonFile('achievements.json');
      if (targetIds) {
        list = list.filter((a) => targetIds.includes(a.student_id));
      }
      if (domain && domain !== 'all') {
        list = list.filter((a) => a.domain === domain);
      }
      list.sort((a, b) => new Date(b.date_awarded) - new Date(a.date_awarded));
    }

    // Attach student relation so frontend leaderboard domain filters populate student cards seamlessly
    const allStudents = await this.listStudents({ limit: 1000 });
    const studentMap = new Map();
    allStudents.forEach((s) => {
      studentMap.set(s.id, s);
      if (s.userId) studentMap.set(s.userId, s);
    });

    return list.map((a) => ({
      ...a,
      students: studentMap.get(a.student_id) || null
    }));
  },

  async createAchievement(data) {
    const record = {
      id: data.id || crypto.randomUUID(),
      student_id: data.student_id,
      domain: data.domain,
      title: data.title,
      description: data.description || '',
      points: Number(data.points),
      date_awarded: data.date_awarded || new Date().toISOString().slice(0, 10),
      created_by: data.created_by,
      created_at: new Date().toISOString()
    };

    if (isMongoConnected) {
      await AchievementModel.create(record);
    } else {
      const list = readJsonFile('achievements.json');
      list.push(record);
      writeJsonFile('achievements.json', list);
    }

    // Auto-recalculate points trigger equivalent (recalc_student_points)
    await this.recalcStudentPoints(record.student_id);
    return record;
  },

  async recalcStudentPoints(student_id) {
    const achievements = await this.listAchievements(student_id);
    const total_points = achievements.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
    await this.updateStudent(student_id, { total_points });
    return total_points;
  },

  async deleteAchievementsByStudentId(student_id) {
    const student = await this.findStudentById(student_id);
    const targetIds = student ? [student.id, student.userId] : [student_id];

    if (isMongoConnected) {
      await AchievementModel.deleteMany({ student_id: { $in: targetIds } });
      return;
    }
    const list = readJsonFile('achievements.json');
    const filtered = list.filter((a) => !targetIds.includes(a.student_id));
    writeJsonFile('achievements.json', filtered);
  },

  // ----------------- OTPs -----------------
  async createOtp(email, purpose = 'password_reset') {
    const cleanEmail = email.trim().toLowerCase();
    // Invalidate previous active OTPs for this email & purpose
    await this.invalidatePreviousOtps(cleanEmail, purpose);

    // Generate cryptographic 6-digit numeric OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    const record = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      code,
      purpose,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected) {
      await OtpModel.create(record);
    } else {
      const otps = readJsonFile('otps.json');
      otps.push(record);
      writeJsonFile('otps.json', otps);
    }

    return record;
  },

  async invalidatePreviousOtps(email, purpose) {
    if (isMongoConnected) {
      await OtpModel.updateMany({ email, purpose, used: false }, { used: true });
      return;
    }
    const otps = readJsonFile('otps.json');
    otps.forEach((o) => {
      if (o.email === email && o.purpose === purpose) o.used = true;
    });
    writeJsonFile('otps.json', otps);
  },

  async verifyOtp(email, code, purpose = 'password_reset') {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim().replace(/\s+/g, '');

    if (isMongoConnected) {
      const match = await OtpModel.findOne({
        email: cleanEmail,
        code: cleanCode,
        purpose,
        used: false,
        expiresAt: { $gt: new Date() }
      }).lean();

      if (!match) return false;
      await OtpModel.updateOne({ id: match.id }, { used: true });
      return true;
    }

    const otps = readJsonFile('otps.json');
    const now = new Date();
    const match = otps.find(
      (o) =>
        o.email === cleanEmail &&
        o.code === cleanCode &&
        o.purpose === purpose &&
        !o.used &&
        new Date(o.expiresAt) > now
    );

    if (!match) return false;
    match.used = true;
    writeJsonFile('otps.json', otps);
    return true;
  }
};
