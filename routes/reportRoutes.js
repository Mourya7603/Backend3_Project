const express = require('express');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get tasks completed in the last week
router.get('/last-week', authenticateToken, async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const completedTasks = await Task.find({
      status: 'Completed',
      updatedAt: { $gte: oneWeekAgo }
    })
      .populate('project')
      .populate('team')
      .populate('owners');
    
    res.json(completedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total days of work pending
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const pendingTasks = await Task.find({
      status: { $ne: 'Completed' }
    });
    
    const totalDaysPending = pendingTasks.reduce((total, task) => {
      return total + task.timeToComplete;
    }, 0);
    
    res.json({ totalDaysPending, pendingTasksCount: pendingTasks.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get number of tasks closed by team, owner, or project
router.get('/closed-tasks', authenticateToken, async (req, res) => {
  try {
    const { groupBy } = req.query; // 'team', 'owner', or 'project'
    
    if (!['team', 'owner', 'project'].includes(groupBy)) {
      return res.status(400).json({ error: 'Invalid groupBy parameter. Use team, owner, or project' });
    }
    
    const completedTasks = await Task.aggregate([
      { $match: { status: 'Completed' } },
      {
        $group: {
          _id: `$${groupBy}`,
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: `${groupBy}s`.toLowerCase(),
          localField: '_id',
          foreignField: '_id',
          as: 'groupInfo'
        }
      },
      {
        $unwind: '$groupInfo'
      },
      {
        $project: {
          _id: 0,
          groupId: '$_id',
          name: '$groupInfo.name',
          count: 1
        }
      }
    ]);
    
    res.json(completedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;