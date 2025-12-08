import express from 'express';
import {
  getStudentStreak,
  updateStudentStreak,
  getStudentNotificationHistory,
  processStudentStreak,
} from '../services/streakService.js';

const router = express.Router();

/**
 * GET /api/streaks/:studentId
 * Get student's streak information
 */
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const streak = await getStudentStreak(studentId);

    if (!streak) {
      return res.status(404).json({ error: 'Streak not found for this student' });
    }

    res.json({
      success: true,
      data: streak,
    });
  } catch (error) {
    console.error('Error getting student streak:', error);
    res.status(500).json({ error: 'Failed to get streak', message: error.message });
  }
});

/**
 * POST /api/streaks/:studentId/complete
 * Mark a student's activity as complete for today (updates streak)
 */
router.post('/:studentId/complete', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const result = await updateStudentStreak(studentId);

    if (!result.success) {
      return res.status(500).json({ error: 'Failed to update streak', message: result.error });
    }

    res.json({
      success: true,
      data: result,
      message: 'Streak updated successfully!',
    });
  } catch (error) {
    console.error('Error completing streak:', error);
    res.status(500).json({ error: 'Failed to complete streak', message: error.message });
  }
});

/**
 * GET /api/streaks/:studentId/notifications
 * Get notification history for a student
 */
router.get('/:studentId/notifications', async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const history = await getStudentNotificationHistory(studentId, limit);

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    console.error('Error getting notification history:', error);
    res.status(500).json({ error: 'Failed to get notification history', message: error.message });
  }
});

/**
 * POST /api/streaks/:studentId/process
 * Process streak check for a specific student
 */
router.post('/:studentId/process', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const result = await processStudentStreak(studentId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error processing streak:', error);
    res.status(500).json({ error: 'Failed to process streak', message: error.message });
  }
});

export default router;
