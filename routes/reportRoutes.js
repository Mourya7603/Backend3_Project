const express = require('express');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get tasks completed in date range
router.get('/completed-tasks', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.updatedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter.updatedAt = { $gte: oneWeekAgo };
    }

    const completedTasks = await Task.find({
      status: 'Completed',
      ...dateFilter
    })
      .populate('project', 'name')
      .populate('team', 'name')
      .populate('owners', 'name email');

    res.json(completedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending work statistics
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const pendingTasks = await Task.find({
      status: { $ne: 'Completed' }
    }).populate('owners', 'name');

    const totalDaysPending = pendingTasks.reduce((total, task) => {
      return total + (task.timeToComplete || 0);
    }, 0);

    res.json({ 
      totalDaysPending, 
      pendingTasksCount: pendingTasks.length,
      pendingTasks 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks grouped by team, owner, or project
router.get('/grouped-tasks', authenticateToken, async (req, res) => {
  try {
    const { groupBy, status } = req.query;
    
    if (!['team', 'owners', 'project'].includes(groupBy)) {
      return res.status(400).json({ error: 'Invalid groupBy parameter. Use team, owners, or project' });
    }

    const matchStage = {};
    if (status) {
      matchStage.status = status;
    }

    const groupedData = await Task.aggregate([
      { $match: matchStage },
      { $unwind: groupBy === 'owners' ? '$owners' : false },
      {
        $group: {
          _id: `$${groupBy}`,
          count: { $sum: 1 },
          totalDays: { $sum: '$timeToComplete' }
        }
      },
      {
        $lookup: {
          from: groupBy === 'owners' ? 'users' : `${groupBy}s`,
          localField: '_id',
          foreignField: '_id',
          as: 'groupInfo'
        }
      },
      {
        $project: {
          _id: 0,
          groupId: '$_id',
          name: { $arrayElemAt: ['$groupInfo.name', 0] },
          count: 1,
          totalDays: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(groupedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;