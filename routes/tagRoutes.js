const express = require('express');
const Tag = require('../models/Tag');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new tag
router.post('/', authenticateToken, async (req, res) => {
  try {
    const tag = new Tag(req.body);
    await tag.save();
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tags
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single tag by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a tag
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tag = await Tag.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a tag
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;