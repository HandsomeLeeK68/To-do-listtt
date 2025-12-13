import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const PORT = 5001;

// MongoDB connection
const mongoURI = 'mongodb+srv://handsomelee:handsomelee@cluster0.ky8lcx0.mongodb.net/?appName=Cluster0';
mongoose.connect(mongoURI);

// Mongoose Schema and Model
const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, required: true, default: false },
});

const Todo = mongoose.model('Todo', todoSchema);

// Middleware
app.use(cors());
app.use(express.json());

// GET: Retrieve all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await Todo.find({});
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// POST: Add a new task
app.post('/api/todos', async (req, res) => {
  try {
    const { text, completed } = req.body;
    const todo = new Todo({
      text,
      completed: completed ?? false,
    });
    const savedTodo = await todo.save();
    res.json(savedTodo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// DELETE: Delete a todo by id
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Todo.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted', id: deleted._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// PUT: Toggle completed status
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Find current todo
    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    todo.completed = !todo.completed;
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
