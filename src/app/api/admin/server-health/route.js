import { withAdmin, apiSuccess, apiError } from '@/lib/apiHelpers';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

// GET /api/admin/server-health
export const GET = withAdmin(async () => {
  try {
    await dbConnect();

    const dbState = mongoose.connection.readyState;
    const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = process.uptime();

    // DB ping
    let dbPingMs = null;
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      dbPingMs = Date.now() - start;
    } catch { /* ignore */ }

    return apiSuccess({
      status: dbState === 1 ? 'healthy' : 'degraded',
      database: {
        status: dbStateMap[dbState] || 'unknown',
        pingMs: dbPingMs,
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'unknown',
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.round(uptimeSeconds),
        uptimeHuman: formatUptime(uptimeSeconds),
        memory: {
          heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
          externalMB: Math.round(memoryUsage.external / 1024 / 1024),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/admin/server-health]', err);
    return apiError('Failed to check server health', 500);
  }
});

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}
