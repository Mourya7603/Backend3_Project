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
    console.error('Completed tasks error:', error);
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
    console.error('Pending tasks error:', error);
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

    // Handle different grouping strategies
    let aggregationPipeline;

    if (groupBy === 'owners') {
      // For owners (array field), we need to unwind first
      aggregationPipeline = [
        { $match: matchStage },
        { $unwind: '$owners' },
        {
          $group: {
            _id: '$owners',
            count: { $sum: 1 },
            totalDays: { $sum: '$timeToComplete' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'ownerInfo'
          }
        },
        {
          $project: {
            _id: 0,
            name: { 
              $ifNull: [
                { $arrayElemAt: ['$ownerInfo.name', 0] },
                { $arrayElemAt: ['$ownerInfo.email', 0] }
              ]
            },
            email: { $arrayElemAt: ['$ownerInfo.email', 0] },
            count: 1,
            totalDays: 1
          }
        },
        { $sort: { count: -1 } }
      ];
    } else {
      // For team and project (single reference fields)
      aggregationPipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: `$${groupBy}`,
            count: { $sum: 1 },
            totalDays: { $sum: '$timeToComplete' }
          }
        },
        {
          $lookup: {
            from: `${groupBy}s`,
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
      ];
    }

    console.log('Running aggregation for:', groupBy, 'with pipeline:', JSON.stringify(aggregationPipeline, null, 2));

    const groupedData = await Task.aggregate(aggregationPipeline);

    // Handle null/undefined names
    const formattedData = groupedData.map(item => ({
      ...item,
      name: item.name || 'Unassigned'
    }));

    console.log('Grouped data result:', formattedData);

    res.json(formattedData);
  } catch (error) {
    console.error('Grouped tasks error:', error);
    console.error('Error details:', {
      groupBy: req.query.groupBy,
      status: req.query.status,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to fetch grouped tasks', details: error.message });
  }
});

module.exports = router;