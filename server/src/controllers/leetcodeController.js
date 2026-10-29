import { fetchLeetCodeProfile } from '../services/leetcodeService.js';

/**
 * Controller to fetch real-time profile stats for a LeetCode username.
 * Supports ?refresh=true query parameter to bypass cache.
 */
export async function getLeetCodeStats(req, res) {
  try {
    const { username } = req.params;
    const forceRefresh = req.query.refresh === 'true' || req.query.refresh === '1';

    if (!username || !username.trim()) {
      return res.status(400).json({ status: 'error', message: 'Username is required' });
    }

    const stats = await fetchLeetCodeProfile(username.trim(), forceRefresh);
    return res.json(stats);
  } catch (err) {
    console.error(`[LEETCODE API] Error fetching "${req.params.username}":`, err.message);
    const isNotFound = err.message.includes('not exist') || err.message.includes('not found');
    return res.status(isNotFound ? 404 : 502).json({
      status: 'error',
      message: err.message
    });
  }
}
