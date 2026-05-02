'use client';
import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Server, Database, Cpu, HardDrive, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function ServerHealthTab() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/server-health');
      const d = await res.json();
      if (d.success) { setHealth(d.data); setLastRefresh(new Date()); }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); const t = setInterval(fetch_, 30000); return () => clearInterval(t); }, []);

  if (loading && !health) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!health) return <p className="text-center text-muted-foreground py-10">Failed to load server health</p>;

  const isHealthy = health.status === 'healthy';
  const mem = health.server?.memory;
  const memPct = mem ? Math.round((mem.heapUsedMB / mem.heapTotalMB) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${isHealthy ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {isHealthy ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          System {isHealthy ? 'Healthy' : 'Degraded'}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {lastRefresh && <span>Updated {lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={fetch_} disabled={loading}><RefreshCw className={`w-4 h-4 hover:text-foreground ${loading ? 'animate-spin text-primary' : 'text-muted-foreground'}`} /></button>
        </div>
      </div>

      {/* Database */}
      <div className="glass-card rounded-2xl p-6 border border-border">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-primary" />Database</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Status', value: health.database?.status, highlight: health.database?.status === 'connected' },
            { label: 'Ping', value: health.database?.pingMs != null ? `${health.database.pingMs}ms` : 'N/A' },
            { label: 'Host', value: health.database?.host || 'N/A' },
            { label: 'Database', value: health.database?.name || 'N/A' },
          ].map(item => (
            <div key={item.label} className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className={`font-bold text-sm truncate ${item.highlight ? 'text-green-500' : ''}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Server */}
      <div className="glass-card rounded-2xl p-6 border border-border">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Server className="w-4 h-4 text-primary" />Server Runtime</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Node.js', value: health.server?.nodeVersion },
            { label: 'Platform', value: health.server?.platform },
            { label: 'Uptime', value: health.server?.uptimeHuman },
          ].map(item => (
            <div key={item.label} className="bg-secondary/40 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="font-bold text-sm">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Memory */}
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Cpu className="w-4 h-4" />Memory Usage</h4>
        <div className="mb-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Heap: {mem?.heapUsedMB}MB / {mem?.heapTotalMB}MB</span>
            <span>{memPct}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${memPct}%`, background: memPct > 80 ? '#ef4444' : memPct > 60 ? '#f97316' : '#10b981' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-secondary/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">RSS</p>
            <p className="font-bold text-sm">{mem?.rssMB}MB</p>
          </div>
          <div className="bg-secondary/40 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">External</p>
            <p className="font-bold text-sm">{mem?.externalMB}MB</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-border">
        <p className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="w-3.5 h-3.5" />Auto-refreshes every 30 seconds · Last: {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'}</p>
      </div>
    </div>
  );
}
