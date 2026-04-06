import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';

export const apiRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// Middleware to verify JWT
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
  }
  next();
};

// --- AUTH ROUTES ---
apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ? AND status = 'active'").get(username) as any;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  let school = null;
  if (user.school_id) {
    school = db.prepare('SELECT * FROM schools WHERE id = ?').get(user.school_id);
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, schoolId: user.school_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.full_name, school } });
});

// --- SUPER ADMIN ROUTES ---
apiRouter.get('/super/stats', authenticate, requireRole(['super_admin']), (req, res) => {
  const totalSchools = db.prepare('SELECT COUNT(*) as count FROM schools').get() as any;
  const activeSchools = db.prepare("SELECT COUNT(*) as count FROM schools WHERE status = 'active'").get() as any;
  const inactiveSchools = db.prepare("SELECT COUNT(*) as count FROM schools WHERE status = 'inactive'").get() as any;
  
  res.json({
    totalSchools: totalSchools.count,
    activeSchools: activeSchools.count,
    inactiveSchools: inactiveSchools.count
  });
});

apiRouter.get('/super/schools', authenticate, requireRole(['super_admin']), (req, res) => {
  const schools = db.prepare('SELECT * FROM schools ORDER BY created_at DESC').all();
  res.json(schools);
});

apiRouter.post('/super/schools', authenticate, requireRole(['super_admin']), (req, res) => {
  const { name, code, address, email, principalName } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO schools (name, code, address, email, principal_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, code, address, email, principalName);
    const schoolId = info.lastInsertRowid;

    // Auto-generate school admin
    const adminUsername = `admin@${code.toLowerCase()}`;
    const adminPassword = Math.random().toString(36).slice(-8);
    const hash = bcrypt.hashSync(adminPassword, 10);

    db.prepare(`
      INSERT INTO users (username, password_hash, role, school_id, email, full_name)
      VALUES (?, ?, 'school_admin', ?, ?, ?)
    `).run(adminUsername, hash, schoolId, email, `Admin ${name}`);

    res.json({ success: true, schoolId, adminUsername, adminPassword });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/super/schools/:id', authenticate, requireRole(['super_admin']), (req, res) => {
  const { name, code, address, email, principalName, status } = req.body;
  try {
    db.prepare(`
      UPDATE schools 
      SET name = ?, code = ?, address = ?, email = ?, principal_name = ?, status = ?
      WHERE id = ?
    `).run(name, code, address, email, principalName, status, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/super/schools/:id', authenticate, requireRole(['super_admin']), (req, res) => {
  try {
    db.prepare(`DELETE FROM schools WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/super/users', authenticate, requireRole(['super_admin']), (req, res) => {
  const users = db.prepare(`SELECT id, username, full_name, email, role, status, created_at FROM users WHERE role = 'super_admin' ORDER BY created_at DESC`).all();
  res.json(users);
});

apiRouter.post('/super/users', authenticate, requireRole(['super_admin']), (req, res) => {
  const { username, fullName, email, password } = req.body;
  try {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, email)
      VALUES (?, ?, 'super_admin', ?, ?)
    `).run(username, hash, fullName, email);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/super/users/:id', authenticate, requireRole(['super_admin']), (req, res) => {
  const { username, fullName, email, password } = req.body;
  try {
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare(`
        UPDATE users SET username = ?, full_name = ?, email = ?, password_hash = ? WHERE id = ? AND role = 'super_admin'
      `).run(username, fullName, email, hash, req.params.id);
    } else {
      db.prepare(`
        UPDATE users SET username = ?, full_name = ?, email = ? WHERE id = ? AND role = 'super_admin'
      `).run(username, fullName, email, req.params.id);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/super/users/:id', authenticate, requireRole(['super_admin']), (req, res) => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'super_admin'`).get() as any;
    if (count.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last super admin' });
    }
    db.prepare(`DELETE FROM users WHERE id = ? AND role = 'super_admin'`).run(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/super/settings/password', authenticate, requireRole(['super_admin']), (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as any;
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Invalid current password' });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- SCHOOL ADMIN ROUTES ---
apiRouter.get('/school/stats', authenticate, requireRole(['school_admin']), (req: any, res) => {
  const schoolId = req.user.schoolId;
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM learners WHERE school_id = ?').get(schoolId) as any;
  const totalStaff = db.prepare("SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role != 'student'").get(schoolId) as any;
  
  res.json({
    totalStudents: totalStudents.count,
    totalStaff: totalStaff.count,
    totalClasses: 12, // Mock for now
    totalExams: 4 // Mock for now
  });
});

apiRouter.get('/school/users', authenticate, requireRole(['school_admin']), (req: any, res) => {
  const users = db.prepare('SELECT id, username, role, email, phone, full_name, status FROM users WHERE school_id = ?').all(req.user.schoolId);
  res.json(users);
});

apiRouter.post('/school/users', authenticate, requireRole(['school_admin']), (req: any, res) => {
  const { role, email, phone, fullName } = req.body;
  const schoolId = req.user.schoolId;
  
  try {
    const username = `${role.substring(0,3)}${Math.floor(Math.random() * 10000)}@school`;
    const password = Math.random().toString(36).slice(-6);
    const hash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (username, password_hash, role, school_id, email, phone, full_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(username, hash, role, schoolId, email, phone, fullName);

    res.json({ success: true, username, password });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/school/learners', authenticate, requireRole(['school_admin', 'teacher']), (req: any, res) => {
  const learners = db.prepare('SELECT * FROM learners WHERE school_id = ?').all(req.user.schoolId);
  res.json(learners);
});

apiRouter.post('/school/learners', authenticate, requireRole(['school_admin']), (req: any, res) => {
  const { admissionNumber, fullName, dob, dateOfAdmission, assessmentNumber, grade, stream } = req.body;
  const schoolId = req.user.schoolId;
  
  try {
    db.prepare(`
      INSERT INTO learners (school_id, admission_number, full_name, dob, date_of_admission, assessment_number, grade, stream)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(schoolId, admissionNumber, fullName, dob, dateOfAdmission, assessmentNumber, grade, stream);

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/school/learners/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  const { admissionNumber, fullName, dob, dateOfAdmission, assessmentNumber, grade, stream } = req.body;
  try {
    db.prepare(`
      UPDATE learners 
      SET admission_number = ?, full_name = ?, dob = ?, date_of_admission = ?, assessment_number = ?, grade = ?, stream = ?
      WHERE id = ? AND school_id = ?
    `).run(admissionNumber, fullName, dob, dateOfAdmission, assessmentNumber, grade, stream, req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/school/learners/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`DELETE FROM learners WHERE id = ? AND school_id = ?`).run(req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- EXAMS ROUTES ---
apiRouter.get('/school/exams', authenticate, requireRole(['school_admin', 'teacher', 'student', 'parent']), (req: any, res) => {
  const exams = db.prepare('SELECT * FROM exams WHERE school_id = ? ORDER BY created_at DESC').all(req.user.schoolId);
  res.json(exams);
});

apiRouter.post('/school/exams', authenticate, requireRole(['school_admin', 'teacher']), (req: any, res) => {
  const { name, term, year } = req.body;
  try {
    db.prepare(`INSERT INTO exams (school_id, name, term, year) VALUES (?, ?, ?, ?)`).run(req.user.schoolId, name, term, year);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/school/exams/:id', authenticate, requireRole(['school_admin', 'teacher']), (req: any, res) => {
  const { name, term, year, status } = req.body;
  try {
    db.prepare(`UPDATE exams SET name = ?, term = ?, year = ?, status = ? WHERE id = ? AND school_id = ?`)
      .run(name, term, year, status, req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/school/exams/:id', authenticate, requireRole(['school_admin', 'teacher']), (req: any, res) => {
  try {
    db.prepare(`DELETE FROM exams WHERE id = ? AND school_id = ?`).run(req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- ACADEMICS ROUTES ---
// GRADES
apiRouter.get('/school/grades', authenticate, (req: any, res) => {
  res.json(db.prepare('SELECT * FROM grades WHERE school_id = ? ORDER BY name').all(req.user.schoolId));
});
apiRouter.post('/school/grades', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`INSERT INTO grades (school_id, name) VALUES (?, ?)`).run(req.user.schoolId, req.body.name);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.put('/school/grades/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`UPDATE grades SET name = ? WHERE id = ? AND school_id = ?`).run(req.body.name, req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.delete('/school/grades/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`DELETE FROM grades WHERE id = ? AND school_id = ?`).run(req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// STREAMS
apiRouter.get('/school/streams', authenticate, (req: any, res) => {
  res.json(db.prepare('SELECT * FROM streams WHERE school_id = ? ORDER BY name').all(req.user.schoolId));
});
apiRouter.post('/school/streams', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`INSERT INTO streams (school_id, name) VALUES (?, ?)`).run(req.user.schoolId, req.body.name);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.put('/school/streams/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`UPDATE streams SET name = ? WHERE id = ? AND school_id = ?`).run(req.body.name, req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.delete('/school/streams/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`DELETE FROM streams WHERE id = ? AND school_id = ?`).run(req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// SUBJECTS
apiRouter.get('/school/subjects', authenticate, (req: any, res) => {
  res.json(db.prepare('SELECT * FROM subjects WHERE school_id = ? ORDER BY name').all(req.user.schoolId));
});
apiRouter.post('/school/subjects', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`INSERT INTO subjects (school_id, name, code) VALUES (?, ?, ?)`).run(req.user.schoolId, req.body.name, req.body.code);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.put('/school/subjects/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`UPDATE subjects SET name = ?, code = ? WHERE id = ? AND school_id = ?`).run(req.body.name, req.body.code, req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.delete('/school/subjects/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`DELETE FROM subjects WHERE id = ? AND school_id = ?`).run(req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// SUBJECT ALLOCATIONS
apiRouter.get('/school/subject-allocations', authenticate, (req: any, res) => {
  const allocations = db.prepare(`
    SELECT sa.*, s.name as subject_name, g.name as grade_name, u.full_name as teacher_name
    FROM subject_allocations sa
    JOIN subjects s ON sa.subject_id = s.id
    JOIN grades g ON sa.grade_id = g.id
    JOIN users u ON sa.teacher_id = u.id
    WHERE sa.school_id = ?
  `).all(req.user.schoolId);
  res.json(allocations);
});
apiRouter.post('/school/subject-allocations', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`INSERT INTO subject_allocations (school_id, subject_id, grade_id, teacher_id) VALUES (?, ?, ?, ?)`).run(req.user.schoolId, req.body.subjectId, req.body.gradeId, req.body.teacherId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.put('/school/subject-allocations/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`UPDATE subject_allocations SET subject_id = ?, grade_id = ?, teacher_id = ? WHERE id = ? AND school_id = ?`).run(req.body.subjectId, req.body.gradeId, req.body.teacherId, req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.delete('/school/subject-allocations/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`DELETE FROM subject_allocations WHERE id = ? AND school_id = ?`).run(req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// GRADE SYSTEMS
apiRouter.get('/school/grade-systems', authenticate, (req: any, res) => {
  res.json(db.prepare('SELECT * FROM grade_systems WHERE school_id = ? ORDER BY min_mark DESC').all(req.user.schoolId));
});
apiRouter.post('/school/grade-systems', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`INSERT INTO grade_systems (school_id, name, min_mark, max_mark, grade_letter, remarks) VALUES (?, ?, ?, ?, ?, ?)`).run(req.user.schoolId, req.body.name, req.body.minMark, req.body.maxMark, req.body.gradeLetter, req.body.remarks);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.put('/school/grade-systems/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`UPDATE grade_systems SET name = ?, min_mark = ?, max_mark = ?, grade_letter = ?, remarks = ? WHERE id = ? AND school_id = ?`).run(req.body.name, req.body.minMark, req.body.maxMark, req.body.gradeLetter, req.body.remarks, req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});
apiRouter.delete('/school/grade-systems/:id', authenticate, requireRole(['school_admin']), (req: any, res) => {
  try {
    db.prepare(`DELETE FROM grade_systems WHERE id = ? AND school_id = ?`).run(req.params.id, req.user.schoolId);
    res.json({ success: true });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// --- TIMETABLE ROUTES ---
apiRouter.get('/school/timetable', authenticate, (req: any, res) => {
  const timetables = db.prepare('SELECT * FROM timetables WHERE school_id = ? ORDER BY day, time').all(req.user.schoolId);
  res.json(timetables);
});

apiRouter.post('/school/timetable', authenticate, requireRole(['school_admin', 'teacher']), (req: any, res) => {
  const { grade, subject, day, time } = req.body;
  try {
    db.prepare(`INSERT INTO timetables (school_id, grade, subject, day, time) VALUES (?, ?, ?, ?, ?)`).run(req.user.schoolId, grade, subject, day, time);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- E-LEARNING ROUTES ---
apiRouter.get('/school/elearning', authenticate, (req: any, res) => {
  const materials = db.prepare('SELECT * FROM materials WHERE school_id = ? ORDER BY created_at DESC').all(req.user.schoolId);
  res.json(materials);
});

apiRouter.post('/school/elearning', authenticate, requireRole(['school_admin', 'teacher']), (req: any, res) => {
  const { title, type, url } = req.body;
  try {
    db.prepare(`INSERT INTO materials (school_id, title, type, url) VALUES (?, ?, ?, ?)`).run(req.user.schoolId, title, type, url);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- LIBRARY ROUTES ---
apiRouter.get('/school/library', authenticate, (req: any, res) => {
  const books = db.prepare('SELECT * FROM books WHERE school_id = ? ORDER BY title').all(req.user.schoolId);
  res.json(books);
});

apiRouter.post('/school/library', authenticate, requireRole(['school_admin', 'teacher', 'staff']), (req: any, res) => {
  const { title, author, status } = req.body;
  try {
    db.prepare(`INSERT INTO books (school_id, title, author, status) VALUES (?, ?, ?, ?)`).run(req.user.schoolId, title, author, status || 'available');
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- MESSAGES ROUTES ---
apiRouter.get('/school/messages', authenticate, (req: any, res) => {
  const messages = db.prepare('SELECT * FROM messages WHERE school_id = ? ORDER BY created_at DESC').all(req.user.schoolId);
  res.json(messages);
});

apiRouter.post('/school/messages', authenticate, requireRole(['school_admin', 'teacher']), (req: any, res) => {
  const { recipientGroup, content } = req.body;
  try {
    db.prepare(`INSERT INTO messages (school_id, recipient_group, content) VALUES (?, ?, ?)`).run(req.user.schoolId, recipientGroup, content);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- FEES ROUTES ---
apiRouter.get('/school/fees', authenticate, requireRole(['school_admin', 'staff', 'parent']), (req: any, res) => {
  const fees = db.prepare(`
    SELECT fees.*, learners.full_name as learner_name, learners.admission_number 
    FROM fees 
    JOIN learners ON fees.learner_id = learners.id 
    WHERE fees.school_id = ? 
    ORDER BY fees.created_at DESC
  `).all(req.user.schoolId);
  res.json(fees);
});

apiRouter.post('/school/fees', authenticate, requireRole(['school_admin', 'staff']), (req: any, res) => {
  const { learnerId, totalAmount, paidAmount } = req.body;
  const balance = Number(totalAmount) - Number(paidAmount);
  try {
    db.prepare(`INSERT INTO fees (school_id, learner_id, total_amount, paid_amount, balance) VALUES (?, ?, ?, ?, ?)`).run(req.user.schoolId, learnerId, totalAmount, paidAmount, balance);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
