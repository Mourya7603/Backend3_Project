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
    const teams = await Team.find().populate('members', 'name email');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single team by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members', 'name email');
    
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
    ).populate('members', 'name email');
    
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

// Add member to team
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Check if user is already a member
    if (team.members.includes(userId)) {
      return res.status(400).json({ error: 'User is already a member of this team' });
    }
    
    // Add user to team
    team.members.push(userId);
    await team.save();
    
    const populatedTeam = await Team.findById(req.params.id).populate('members', 'name email');
    res.json(populatedTeam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove member from team
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Check if user is a member
    if (!team.members.includes(req.params.userId)) {
      return res.status(400).json({ error: 'User is not a member of this team' });
    }
    
    // Remove user from team
    team.members = team.members.filter(memberId => 
      memberId.toString() !== req.params.userId
    );
    
    await team.save();
    
    const populatedTeam = await Team.findById(req.params.id).populate('members', 'name email');
    res.json(populatedTeam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;