const express = require('express');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    await task.populate(['project', 'team', 'owners']);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { team, owner, tags, project, status } = req.query;
    const filter = {};
    
    if (team) filter.team = team;
    if (owner) filter.owners = owner;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (project) filter.project = project;
    if (status) filter.status = status;
    
    const tasks = await Task.find(filter)
      .populate('project')
      .populate('team')
      .populate('owners');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    )
      .populate('project')
      .populate('team')
      .populate('owners');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;