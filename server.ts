import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-school-system';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Initialize SQLite Database
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      school_id TEXT,
      full_name TEXT NOT NULL,
      phone TEXT,
      status TEXT DEFAULT 'active',
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      address TEXT,
      email TEXT,
      principal_name TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS learners (
      id TEXT PRIMARY KEY,
      admission_number TEXT NOT NULL,
      full_name TEXT NOT NULL,
      dob TEXT,
      date_of_admission TEXT,
      assessment_number TEXT,
      grade TEXT,
      stream TEXT,
      school_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fees (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      term TEXT,
      year TEXT,
      receipt_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time_in TEXT,
      time_out TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Bootstrap Super Admin
  const adminEmail = 'admin@pro.com';
  const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', adminEmail);
  if (!existingAdmin) {
    const hash = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT INTO users (id, email, password_hash, role, full_name, status) VALUES (?, ?, ?, ?, ?, ?)',
      [crypto.randomUUID(), adminEmail, hash, 'super_admin', 'Super Admin', 'active']
    );
    console.log('Bootstrapped super admin: admin@pro.com / admin123');
  }

  // Authentication Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API ROUTES ---

  // Login
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await db.get('SELECT * FROM users WHERE email = ?', email);
      if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', user.id);

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, schoolId: user.school_id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({
        token,
        user: {
          uid: user.id,
          email: user.email,
          role: user.role,
          schoolId: user.school_id,
          fullName: user.full_name
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Get current user
  app.get('/api/auth/me', authenticateToken, async (req: any, res: any) => {
    try {
      const user = await db.get('SELECT id, email, role, school_id, full_name FROM users WHERE id = ?', req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      res.json({
        uid: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.school_id,
        fullName: user.full_name
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- SUPER ADMIN ROUTES ---

  // Get all schools
  app.get('/api/schools', authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    const schools = await db.all('SELECT * FROM schools');
    res.json(schools);
  });

  // Get single school
  app.get('/api/schools/:id', authenticateToken, async (req: any, res: any) => {
    // Both super_admin and school users should be able to get school info
    if (req.user.role !== 'super_admin' && req.user.schoolId !== req.params.id) {
       return res.sendStatus(403);
    }
    const school = await db.get('SELECT * FROM schools WHERE id = ?', req.params.id);
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.json(school);
  });

  // Create school
  app.post('/api/schools', authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    const { name, code, address, email, principalName, status } = req.body;
    
    try {
      const schoolId = crypto.randomUUID();
      await db.run(
        'INSERT INTO schools (id, name, code, address, email, principal_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [schoolId, name, code, address, email, principalName, status || 'active']
      );

      // Auto-generate school admin
      const adminEmail = 'admin@' + code.toLowerCase().replace(/\s+/g, '') + '.com';
      const adminPassword = Math.random().toString(36).slice(-8);
      const hash = await bcrypt.hash(adminPassword, 10);
      const adminId = crypto.randomUUID();

      await db.run(
        'INSERT INTO users (id, email, password_hash, role, school_id, full_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [adminId, adminEmail, hash, 'school_admin', schoolId, name + ' Admin', 'active']
      );

      res.json({ schoolId, adminEmail, adminPassword });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update school
  app.put('/api/schools/:id', authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    const { name, code, address, email, principalName, status } = req.body;
    await db.run(
      'UPDATE schools SET name = ?, code = ?, address = ?, email = ?, principal_name = ?, status = ? WHERE id = ?',
      [name, code, address, email, principalName, status, req.params.id]
    );
    res.json({ success: true });
  });

  // Delete school
  app.delete('/api/schools/:id', authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    await db.run('DELETE FROM schools WHERE id = ?', req.params.id);
    await db.run('DELETE FROM users WHERE school_id = ?', req.params.id);
    res.json({ success: true });
  });

  // Get super admins and school admins
  app.get('/api/users', authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    const users = await db.all('SELECT id, email, role, school_id, full_name, status, last_login FROM users WHERE role IN ("super_admin", "school_admin")');
    res.json(users);
  });

  // Create super admin
  app.post('/api/users', authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    const { email, fullName, role } = req.body;
    try {
      const password = Math.random().toString(36).slice(-8);
      const hash = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();

      await db.run(
        'INSERT INTO users (id, email, password_hash, role, full_name, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, email, hash, role || 'super_admin', fullName, 'active']
      );
      res.json({ email, password });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete user
  app.delete('/api/users/:id', authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    await db.run('DELETE FROM users WHERE id = ?', req.params.id);
    res.json({ success: true });
  });

  // Update user
  app.put('/api/users/:id', authenticateToken, async (req: any, res: any) => {
    if (req.user.role !== 'super_admin' && req.user.id !== req.params.id) return res.sendStatus(403);
    const { fullName, email, password } = req.body;
    try {
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        await db.run('UPDATE users SET full_name = ?, email = ?, password_hash = ? WHERE id = ?', [fullName, email, hash, req.params.id]);
      } else {
        await db.run('UPDATE users SET full_name = ?, email = ? WHERE id = ?', [fullName, email, req.params.id]);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // --- SCHOOL ADMIN ROUTES ---

  // Get school users (staff)
  app.get('/api/school/users', authenticateToken, async (req: any, res: any) => {
    if (!req.user.schoolId) return res.sendStatus(403);
    const users = await db.all('SELECT id, email, role, full_name, phone, status, last_login FROM users WHERE school_id = ? AND role IN ("teacher", "parent", "staff")', req.user.schoolId);
    res.json(users);
  });

  // Create school user
  app.post('/api/school/users', authenticateToken, async (req: any, res: any) => {
    if (!req.user.schoolId) return res.sendStatus(403);
    const { email, fullName, role, phone } = req.body;
    try {
      const password = Math.random().toString(36).slice(-8);
      const hash = await bcrypt.hash(password, 10);
      const userId = crypto.randomUUID();

      await db.run(
        'INSERT INTO users (id, email, password_hash, role, school_id, full_name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, email, hash, role, req.user.schoolId, fullName, phone, 'active']
      );
      res.json({ email, password });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get learners
  app.get('/api/school/learners', authenticateToken, async (req: any, res: any) => {
    if (!req.user.schoolId) return res.sendStatus(403);
    const learners = await db.all('SELECT * FROM learners WHERE school_id = ?', req.user.schoolId);
    res.json(learners);
  });

  // Create learner
  app.post('/api/school/learners', authenticateToken, async (req: any, res: any) => {
    if (!req.user.schoolId) return res.sendStatus(403);
    const { admissionNumber, fullName, dob, dateOfAdmission, assessmentNumber, grade, stream } = req.body;
    try {
      const learnerId = crypto.randomUUID();
      await db.run(
        'INSERT INTO learners (id, admission_number, full_name, dob, date_of_admission, assessment_number, grade, stream, school_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [learnerId, admissionNumber, fullName, dob, dateOfAdmission, assessmentNumber, grade, stream, req.user.schoolId, 'active']
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update learner
  app.put('/api/school/learners/:id', authenticateToken, async (req: any, res: any) => {
    if (!req.user.schoolId) return res.sendStatus(403);
    const { admissionNumber, fullName, dob, dateOfAdmission, assessmentNumber, grade, stream } = req.body;
    await db.run(
      'UPDATE learners SET admission_number = ?, full_name = ?, dob = ?, date_of_admission = ?, assessment_number = ?, grade = ?, stream = ? WHERE id = ? AND school_id = ?',
      [admissionNumber, fullName, dob, dateOfAdmission, assessmentNumber, grade, stream, req.params.id, req.user.schoolId]
    );
    res.json({ success: true });
  });

  // Delete learner
  app.delete('/api/school/learners/:id', authenticateToken, async (req: any, res: any) => {
    if (!req.user.schoolId) return res.sendStatus(403);
    await db.run('DELETE FROM learners WHERE id = ? AND school_id = ?', [req.params.id, req.user.schoolId]);
    res.json({ success: true });
  });

  // Bulk create learners (CSV)
  app.post('/api/school/learners/bulk', authenticateToken, async (req: any, res: any) => {
    if (!req.user.schoolId) return res.sendStatus(403);
    const { learners } = req.body;
    
    try {
      await db.run('BEGIN TRANSACTION');
      const stmt = await db.prepare('INSERT INTO learners (id, admission_number, full_name, dob, date_of_admission, assessment_number, grade, stream, school_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      
      for (const learner of learners) {
        await stmt.run([
          crypto.randomUUID(),
          learner.admissionNumber,
          learner.fullName,
          learner.dob,
          learner.dateOfAdmission,
          learner.assessmentNumber,
          learner.grade,
          learner.stream,
          req.user.schoolId,
          'active'
        ]);
      }
      await stmt.finalize();
      await db.run('COMMIT');
      res.json({ success: true });
    } catch (error: any) {
      await db.run('ROLLBACK');
      res.status(400).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log('Server running on http://localhost:' + PORT);
  });
}

startServer();
