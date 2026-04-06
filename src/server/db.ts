import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'school_management.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    address TEXT,
    email TEXT,
    principal_name TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- super_admin, school_admin, teacher, student, parent, staff
    school_id INTEGER,
    email TEXT,
    phone TEXT,
    full_name TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS learners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    school_id INTEGER NOT NULL,
    admission_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    dob DATE,
    date_of_admission DATE,
    assessment_number TEXT,
    grade TEXT,
    stream TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
    UNIQUE(school_id, admission_number)
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    term TEXT,
    year TEXT,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS timetables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    grade TEXT NOT NULL,
    subject TEXT NOT NULL,
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    recipient_group TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    learner_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    paid_amount REAL NOT NULL,
    balance REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
    FOREIGN KEY (learner_id) REFERENCES learners (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS subject_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    grade_id INTEGER NOT NULL,
    teacher_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    FOREIGN KEY (grade_id) REFERENCES grades (id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS grade_systems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    min_mark REAL NOT NULL,
    max_mark REAL NOT NULL,
    grade_letter TEXT NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
  );
`);

// Seed Super Admin if not exists
const superAdminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin@pro');
if (!superAdminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (username, password_hash, role, full_name)
    VALUES (?, ?, 'super_admin', 'System Administrator')
  `).run('admin@pro', hash);
}

export { db };
