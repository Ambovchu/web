require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '2402',
  database: process.env.DB_NAME || 'vacation_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (!users.length) return res.status(401).json({ error: 'Invalid user' });

    req.user = users[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

const isCEO = (req, res, next) => {
  if (req.user.role_id !== 1) return res.status(403).json({ error: 'CEO access required' });
  next();
};

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, first_name, last_name } = req.body;

    if (!username || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(409).json({ error: 'Username exists' });

    const [result] = await pool.query(
      `INSERT INTO users (username, password, first_name, last_name, role_id)
       VALUES (?, ?, ?, ?, 4)`,
      [username, hashedPassword, first_name, last_name]
    );

    res.status(201).json({ message: 'User registered', userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role_id: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role_id: user.role_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/users', authenticate, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, first_name, last_name, role_id FROM users');
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/vacations', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { start_date, end_date, type } = req.body;

    if (!start_date || !end_date || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ error: 'Invalid date range' });
    }

    if (type === 'sick' && !req.file) {
      return res.status(400).json({ error: 'Medical certificate required' });
    }

    const [result] = await pool.query(
      `INSERT INTO vacations 
       (user_id, start_date, end_date, type, file_path)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, start_date, end_date, type, req.file?.path || null]
    );

    res.status(201).json({ message: 'Vacation request created', vacationId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vacation request' });
  }
});

app.patch('/users/:id/role', authenticate, isCEO, async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id } = req.body;

    if (!role_id) return res.status(400).json({ error: 'Role ID is required.' });

    await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [role_id, id]);
    res.json({ message: 'User role updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

app.patch('/vacations/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const [vacation] = await pool.query('SELECT * FROM vacations WHERE id = ?', [id]);
    if (!vacation.length) return res.status(404).json({ error: 'Vacation not found' });

    if (req.user.role_id !== 1) { 
      const [team] = await pool.query(
        `SELECT leader_id FROM teams WHERE id = (
          SELECT team_id FROM users WHERE id = ?
        )`,
        [vacation[0].user_id]
      );

      if (!team.length || team[0].leader_id !== req.user.id) {
        return res.status(403).json({ error: 'Approval not authorized' });
      }
    }

    await pool.query(
      `UPDATE vacations 
       SET is_approved = TRUE, approved_by = ?, approved_at = NOW() 
       WHERE id = ?`,
      [req.user.id, id]
    );

    res.json({ message: 'Vacation approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve vacation request' });
  }
});

app.get('/vacations/pending', authenticate, isCEO, async (req, res) => {
  try {
    const [vacations] = await pool.query(
      `SELECT v.id, v.user_id, v.start_date, v.end_date, v.type 
       FROM vacations v 
       WHERE v.is_approved = FALSE`
    );

    res.json(vacations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending vacations' });
  }
});

app.patch('/vacations/:id/approve', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE vacations 
       SET is_approved = TRUE 
       WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Vacation approved successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve vacation request.' });
  }
});

app.get('/vacations/team-pending', authenticate, async (req, res) => {
  try {
    if (req.user.role_id !== 3) return res.status(403).json({ error: 'Access denied' });

    const [vacations] = await pool.query(
      `SELECT v.id, v.start_date, v.end_date, v.type, 
              u.first_name AS requester_first_name, u.last_name AS requester_last_name 
       FROM vacations v 
       JOIN users u ON v.user_id = u.id 
       WHERE v.is_approved = FALSE AND u.team_id = (
         SELECT team_id FROM users WHERE id = ?
       )`,
      [req.user.id]
    );

    res.json(vacations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch team vacations' });
  }
});

app.post('/teams', authenticate, isCEO, async (req, res) => {
  try {
    const { name, project_id, leader_id } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO teams (name, project_id, leader_id)
       VALUES (?, ?, ?)`,
      [name, project_id, leader_id]
    );

    res.status(201).json({ message: 'Team created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Team creation failed' });
  }
});

app.get('/teams', authenticate, async (req, res) => {
  try {
    const [teams] = await pool.query('SELECT * FROM teams');
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.post('/projects', authenticate, isCEO, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO projects (name, description)
       VALUES (?, ?)`,
      [name, description]
    );

    res.status(201).json({ message: 'Project created', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Project creation failed' });
  }
});

app.get('/projects', authenticate, async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT * FROM projects');
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
