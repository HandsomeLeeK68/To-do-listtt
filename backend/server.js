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
mongoose.connect(process.env.MONGO_URI || mongoURI);

// ====== User Schema and Model ======
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // New profile fields
  displayName: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
  bio: { type: String, default: "" },
  birthday: { type: Date, default: null } 
});
const User = mongoose.model('User', userSchema);

// ====== Todo Schema and Model (link to userId), with DnD position ======
const todoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  text: { type: String, required: true },
  completed: { type: Boolean, required: true, default: false },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  createdAt: { type: Date, default: Date.now },
  dueDate: { type: Date, default: null },
  position: { type: Number, default: 0, required: true } // for drag-and-drop ordering
});
const Todo = mongoose.model('Todo', todoSchema);

// Middleware
app.use(cors());
app.use(express.json());

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token format is Bearer <token>' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid/Expired token' });
    req.user = user;
    next();
  });
}

// ==== Authentication Routes ====

// Register Route
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

// Login Route
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

// ==== User Profile Update Route ====
// PUT /api/user/profile -- Auth required, only updates the user's editable profile fields
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    console.log("Received profile update request:", req.body); // Log request data
    const { displayName, avatarUrl, bio, birthday } = req.body;
    
    // Handle Date: Convert empty string to null to prevent CastError
    let parsedBirthday = null;
    if (birthday && birthday !== "") {
      parsedBirthday = new Date(birthday);
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.displayName = displayName;
    user.avatarUrl = avatarUrl;
    user.bio = bio;
    user.birthday = parsedBirthday;

    await user.save();
    console.log("User profile updated successfully");
    // Return updated user profile (remove password)
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    console.error("Error updating profile:", err); // Log the specific error
    res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
});

// ==== GET /api/user/me Route ====
// Get current user's profile data
app.get('/api/user/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ==== Protected TODO Routes ====

// GET: Retrieve all todos for current user, sorted by POSITION then createdAt
app.get('/api/todos', authenticateToken, async (req, res) => {
  try {
    // Now sorted by position (asc), then createdAt (asc)
    const todos = await Todo.find({ userId: req.user.userId }).lean();
    todos.sort((a, b) => {
      if ((a.position ?? 0) !== (b.position ?? 0)) {
        return (a.position ?? 0) - (b.position ?? 0);
      } 
      // fallback to createdAt (oldest first)
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST: Add new todo, setting its position (at end by default)
app.post('/api/todos', authenticateToken, async (req, res) => {
  try {
    //console.log("📨 Server nhận được:", req.body);
    const { text, priority, dueDate } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    let todoPriority = priority;
    if (!['High', 'Medium', 'Low'].includes(todoPriority)) {
      todoPriority = 'Medium';
    }

    // Prepare dueDate for Mongo
    let realDueDate = null;
    if (typeof dueDate !== "undefined" && dueDate !== null && dueDate !== "") {
      const asDate = new Date(dueDate);
      realDueDate = isNaN(asDate.getTime()) ? null : asDate;
    }

    // For drag reorder: new task goes to max position + 1 by default
    const lastTodo = await Todo.findOne({ userId: req.user.userId }).sort('-position');
    let newPosition = 0;
    if (lastTodo && typeof lastTodo.position === "number") {
      newPosition = lastTodo.position + 1;
    }

    // Save to DB with accurate dueDate and position
    const newTodo = new Todo({
      text,
      priority: todoPriority,
      completed: false,
      userId: req.user.userId,
      dueDate: realDueDate,
      position: newPosition
    });

    const saved = await newTodo.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// DELETE: Remove a todo by id for the current user
app.delete('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
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

// PUT: Update todo (allow updating dueDate and position)
app.put('/api/todos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed, priority, dueDate, position } = req.body;

    // Find todo and ensure ownership
    const todo = await Todo.findOne({ _id: id, userId: req.user.userId });
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found or not yours' });
    }

    // Update provided fields
    if (typeof text === 'string') {
      todo.text = text;
    }
    if (typeof completed === 'boolean') {
      todo.completed = completed;
    }
    if (typeof priority === 'string' && ['High', 'Medium', 'Low'].includes(priority)) {
      todo.priority = priority;
    }
    if (typeof position === 'number') {
      todo.position = position;
    }

    // Due date logic: allow setting, clearing, or updating
    if (Object.prototype.hasOwnProperty.call(req.body, 'dueDate')) {
      if (dueDate === null || dueDate === "") {
        todo.dueDate = null;
      } else {
        const dateObj = new Date(dueDate);
        todo.dueDate = isNaN(dateObj.getTime()) ? null : dateObj;
      }
    }

    // For API backward compat: toggle 'completed' if no fields
    if (
      text === undefined &&
      completed === undefined &&
      priority === undefined &&
      dueDate === undefined &&
      position === undefined
    ) {
      todo.completed = !todo.completed;
    }

    const updated = await todo.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// ====== DRAG & DROP REORDERING ROUTE ======
// PUT /api/todos/reorder
// Accepts: [{ id: <id>, position: <number> }, ...]
app.put('/api/todos/reorder', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Body must be an array of { id, position }' });
    }
    const ops = updates.map(up => {
      if (typeof up.id !== "string" || typeof up.position !== "number") return null;
      return Todo.updateOne(
        { _id: up.id, userId: req.user.userId },
        { $set: { position: up.position } }
      );
    }).filter(Boolean);

    await Promise.all(ops);

    res.json({ message: 'Reordered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder todos' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
