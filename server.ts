import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}
const db = new Database(path.join(dbDir, 'database.sqlite'));

// Create generic documents table for NoSQL-like behavior
db.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    collection TEXT,
    id TEXT,
    data TEXT,
    PRIMARY KEY (collection, id)
  )
`);

// API Routes
app.get('/api/db/:collection', (req, res) => {
  const { collection } = req.params;
  try {
    const stmt = db.prepare('SELECT id, data FROM documents WHERE collection = ?');
    const rows = stmt.all(collection);
    const docs = rows.map((row: any) => ({
      id: row.id,
      ...JSON.parse(row.data)
    }));
    res.json(docs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/db/:collection', (req, res) => {
  const { collection } = req.params;
  const data = req.body;
  const id = data.id || Math.random().toString(36).substring(2, 15);
  
  try {
    const stmt = db.prepare('INSERT INTO documents (collection, id, data) VALUES (?, ?, ?)');
    stmt.run(collection, id, JSON.stringify({ ...data, id }));
    res.json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/db/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  const data = req.body;
  
  try {
    // Get existing
    const getStmt = db.prepare('SELECT data FROM documents WHERE collection = ? AND id = ?');
    const existing = getStmt.get(collection, id);
    
    let newData = data;
    if (existing) {
      newData = { ...JSON.parse((existing as any).data), ...data };
      const stmt = db.prepare('UPDATE documents SET data = ? WHERE collection = ? AND id = ?');
      stmt.run(JSON.stringify(newData), collection, id);
    } else {
      const stmt = db.prepare('INSERT INTO documents (collection, id, data) VALUES (?, ?, ?)');
      stmt.run(collection, id, JSON.stringify({ ...newData, id }));
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/db/:collection/:id', (req, res) => {
  const { collection, id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM documents WHERE collection = ? AND id = ?');
    stmt.run(collection, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auth Routes (Mocking Firebase Auth over SQLite)
db.exec(`
  CREATE TABLE IF NOT EXISTS auth_users (
    uid TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    data TEXT
  )
`);

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Super admin hardcoded check
  if ((email === 'admin@pro.com' || email === 'admin@pro') && password === 'admin123') {
    const user = { uid: 'super-admin', email: 'admin@pro', role: 'super_admin' };
    
    // Ensure super admin exists in documents
    const getStmt = db.prepare('SELECT * FROM documents WHERE collection = ? AND id = ?');
    if (!getStmt.get('users', 'super-admin')) {
      const stmt = db.prepare('INSERT INTO documents (collection, id, data) VALUES (?, ?, ?)');
      stmt.run('users', 'super-admin', JSON.stringify({
        id: 'super-admin',
        uid: 'super-admin',
        email: 'admin@pro',
        role: 'super_admin',
        schoolId: null,
        fullName: 'Super Admin',
        phone: '',
        status: 'active',
        createdAt: new Date().toISOString()
      }));
    }
    return res.json({ user });
  }

  try {
    const stmt = db.prepare('SELECT * FROM auth_users WHERE email = ? AND password = ?');
    const authUser = stmt.get(email, password) as any;
    
    if (authUser) {
      // Update last login in users collection
      const userStmt = db.prepare('SELECT data FROM documents WHERE collection = ? AND id = ?');
      const userDoc = userStmt.get('users', authUser.uid) as any;
      
      let userData = {};
      if (userDoc) {
        userData = JSON.parse(userDoc.data);
        (userData as any).lastLogin = new Date().toISOString();
        const updateStmt = db.prepare('UPDATE documents SET data = ? WHERE collection = ? AND id = ?');
        updateStmt.run(JSON.stringify(userData), 'users', authUser.uid);
      }
      
      res.json({ user: { ...JSON.parse(authUser.data), ...userData } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, uid: providedUid } = req.body;
  const uid = providedUid || Math.random().toString(36).substring(2, 15);
  
  try {
    const stmt = db.prepare('INSERT INTO auth_users (uid, email, password, data) VALUES (?, ?, ?, ?)');
    stmt.run(uid, email, password, JSON.stringify({ uid, email }));
    res.json({ user: { uid, email } });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already in use' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/auth/update-password', (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  try {
    const stmt = db.prepare('UPDATE auth_users SET password = ? WHERE email = ? AND password = ?');
    const result = stmt.run(newPassword, email, oldPassword);
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid credentials' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();