import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

// MongoDB connection
const mongoURI = 'mongodb+srv://handsomelee:handsomelee@cluster0.ky8lcx0.mongodb.net/?appName=Cluster0';
mongoose.connect(process.env.MONGO_URI || mongoURI)

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Todo Schema and Model (link to userId)
const todoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  text: { type: String, required: true },
  completed: { type: Boolean, required: true, default: false },
  priority: { 
    type: String, 
    enum: ['High', 'Medium', 'Low'], 
    default: 'Medium' 
  },
});
const Todo = mongoose.model('Todo', todoSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token format is Bearer <token>' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid/Expired token' });
    req.user = user; // user: { userId, username }
    next();
  });
}

// Authentication Routes

// Register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const existing = await User.findOne({ username });
    if (existing)
      return res.status(409).json({ error: 'Username already taken' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();

    res.json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Protected TODO Routes

// GET: Retrieve all todos for current user
app.get('/api/todos', authenticateToken, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.userId });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST: Add a new task for current user (now supports priority)
app.post('/api/todos', authenticateToken, async (req, res) => {
  try {
    const { text, completed, priority } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    let todoPriority = priority;
    if (!['High', 'Medium', 'Low'].includes(todoPriority)) {
      todoPriority = 'Medium'; // fallback to default
    }

    const todo = new Todo({
      userId: req.user.userId,
      text,
      completed: completed ?? false,
      priority: todoPriority
    });
    const savedTodo = await todo.save();
    res.json(savedTodo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// DELETE: Delete a todo for current user by id
app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // Find todo and ensure ownership
    const todo = await Todo.findOne({ _id: id, userId: req.user.userId });
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or not yours' });
    }

    await Todo.deleteOne({ _id: id });
    res.json({ message: 'Todo deleted', id: id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// PUT: Edit a todo (update text, priority, or completed) for current user's todo
app.put('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, priority } = req.body;
    // Find todo and ensure ownership
    const todo = await Todo.findOne({ _id: id, userId: req.user.userId });
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or not yours' });
    }

    // Only update fields provided in req.body

    if (typeof text === 'string') {
      todo.text = text;
    }
    if (typeof completed === 'boolean') {
      todo.completed = completed;
    }
    if (typeof priority === 'string' && ['High', 'Medium', 'Low'].includes(priority)) {
      todo.priority = priority;
    }

    // If no fields are provided, fallback to toggling completed (for backward compat.)
    if (
      text === undefined &&
      completed === undefined &&
      priority === undefined
    ) {
      todo.completed = !todo.completed;
    }

    const updated = await todo.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
