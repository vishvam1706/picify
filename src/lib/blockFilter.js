import BlockedUser from '@/models/BlockedUser';

/**
 * Returns an array of user IDs that the given user has blocked.
 * Used to filter pins, users, and activities from blocked users.
 * Returns an empty array if userId is null/undefined (guest).
 *
 * @param {ObjectId|string|null} userId - The current viewer's user ID
 * @returns {Promise<string[]>} Array of blocked user ID strings
 */
export async function getBlockedUserIds(userId) {
  if (!userId) return [];
  try {
    const records = await BlockedUser.find({ userId }).select('blockedUserId').lean();
    return records.map(r => r.blockedUserId.toString());
  } catch {
    return [];
  }
}

/**
 * Adds a `userId: { $nin: blockedIds }` filter to a mongo query
 * if there are any blocked users. Safe to call with an empty array.
 *
 * @param {object} query - Existing Mongoose query object
 * @param {string[]} blockedIds - Array of blocked user ID strings
 * @returns {object} Updated query
 */
export function applyBlockFilter(query, blockedIds) {
  if (!blockedIds || blockedIds.length === 0) return query;
  return { ...query, userId: { ...query.userId, $nin: blockedIds } };
}
