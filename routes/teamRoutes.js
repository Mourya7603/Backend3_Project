const express = require('express');
const Team = require('../models/Team');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new team
router.post('/', authenticateToken, async (req, res) => {
  try {
    const team = new Team(req.body);
    await team.save();
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all teams
router.get('/', authenticateToken, async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single team by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a team
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a team
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;