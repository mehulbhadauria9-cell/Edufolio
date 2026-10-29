// In-memory cache with 10-minute TTL
const leetcodeCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

async function querySingleCandidate(username) {
  // Tier 1: Try official LeetCode GraphQL with 4-second timeout
  try {
    const query = `
      query getUserProfile($username: String!) {
        allQuestionsCount { difficulty count }
        matchedUser(username: $username) {
          username
          profile { realName ranking userAvatar reputation }
          submitStats {
            acSubmissionNum { difficulty count }
            totalSubmissionNum { difficulty count }
          }
        }
      }
    `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({ query, variables: { username } }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data?.data?.matchedUser) {
        const u = data.data.matchedUser;
        const allCounts = data.data.allQuestionsCount || [];
        const totalEasy = allCounts.find((c) => c.difficulty === 'Easy')?.count || 969;
        const totalMedium = allCounts.find((c) => c.difficulty === 'Medium')?.count || 2124;
        const totalHard = allCounts.find((c) => c.difficulty === 'Hard')?.count || 980;
        const totalQuestions = allCounts.find((c) => c.difficulty === 'All')?.count || 4073;

        const ac = u.submitStats?.acSubmissionNum || [];
        const easySolved = ac.find((c) => c.difficulty === 'Easy')?.count || 0;
        const mediumSolved = ac.find((c) => c.difficulty === 'Medium')?.count || 0;
        const hardSolved = ac.find((c) => c.difficulty === 'Hard')?.count || 0;
        const totalSolved = ac.find((c) => c.difficulty === 'All')?.count || (easySolved + mediumSolved + hardSolved);

        return {
          status: 'success',
          username: u.username,
          realName: u.profile?.realName || u.username,
          avatar: u.profile?.userAvatar || null,
          ranking: u.profile?.ranking || 0,
          reputation: u.profile?.reputation || 0,
          totalSolved,
          totalQuestions,
          easySolved,
          totalEasy,
          mediumSolved,
          totalMedium,
          hardSolved,
          totalHard,
          source: 'official'
        };
      }
    }
  } catch (err) {
    // Fall through
  }

  // Tier 2: Try Alfa LeetCode API (mirror)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://alfa-leetcode-api.onrender.com/userProfile/${encodeURIComponent(username)}`, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.totalSolved !== undefined && !data.errors) {
        return {
          status: 'success',
          username,
          realName: data.name || username,
          avatar: data.avatar || null,
          ranking: data.ranking || 0,
          reputation: data.reputation || data.contributionPoint || 0,
          totalSolved: data.totalSolved || 0,
          totalQuestions: data.totalQuestions || 4073,
          easySolved: data.easySolved || 0,
          totalEasy: data.totalEasy || 969,
          mediumSolved: data.mediumSolved || 0,
          totalMedium: data.totalMedium || 2124,
          hardSolved: data.hardSolved || 0,
          totalHard: data.totalHard || 980,
          recentSubmissions: data.recentSubmissions || [],
          source: 'alfa'
        };
      }
    }
  } catch (err) {
    // Fall through
  }

  return null;
}

/**
 * Highly resilient, multi-tiered LeetCode profile fetcher:
 * 1. Sanitizes user input (strips leading @, leetcode URLs, slashes)
 * 2. Checks fast in-memory cache (<1ms)
 * 3. Tries candidate handle variations (e.g. pratham1805_ -> pratham1805)
 * 4. Stale cache fallback if external APIs are unreachable
 */
export async function fetchLeetCodeProfile(rawUsername, forceRefresh = false) {
  if (!rawUsername || typeof rawUsername !== 'string') {
    throw new Error('Valid LeetCode username is required');
  }

  // Clean raw handle
  let cleanUsername = rawUsername
    .trim()
    .replace(/^@+/, '')
    .replace(/^https?:\/\/(?:www\.)?leetcode\.com\/(?:u\/)?/i, '')
    .replace(/\/+$/, '');

  if (!cleanUsername) {
    throw new Error('Valid LeetCode username is required');
  }

  const cacheKey = cleanUsername.toLowerCase();

  if (!forceRefresh && leetcodeCache.has(cacheKey)) {
    const cached = leetcodeCache.get(cacheKey);
    if (Date.now() < cached.expiresAt) {
      return cached.data;
    }
  }

  // Candidate handles to test (exact match first, then auto-corrected variant)
  const candidates = [cleanUsername];
  if (cleanUsername.endsWith('_')) {
    candidates.push(cleanUsername.replace(/_+$/, ''));
  }

  for (const c of candidates) {
    const result = await querySingleCandidate(c);
    if (result) {
      leetcodeCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    }
  }

  // Return stale cache if available
  if (leetcodeCache.has(cacheKey)) {
    const stale = leetcodeCache.get(cacheKey);
    return { ...stale.data, stale: true };
  }

  throw new Error(`LeetCode profile for "${cleanUsername}" could not be reached or does not exist`);
}
