'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface GigaData {
  timestamp: number;
  energy: { current: number; max: number; regenPerHour: number; isJuiced: boolean };
  fishing: { castsUsed: number; maxPerDay: number; maxPerDayJuiced: number; hasActiveGame: boolean };
  juice: { isJuiced: boolean; secondsRemaining: number };
  dungeon: { runsToday: number; maxRuns: number };
  inventory: Record<string, number>;
  skills: {
    dungeon: { level: number; levels: (number | null)[] };
    fishing: { level: number; levels: (number | null)[] };
  };
}

interface SessionData {
  date: string;
  runs: { won: boolean; rooms: number; finalHP: number }[];
  scrapBefore: number;
  scrapAfter: number;
  leveledUp: boolean;
  finalEnergy: number;
}

const ITEM_NAMES: Record<number, string> = {
  2: 'Dungeon Scrap',
  4: 'Bolt',
  5: 'Steel Pipe',
  8: 'Temporal Hourglass',
  21: 'Wood',
  22: 'Fiber',
  49: 'Wood Rod',
  50: 'Stone Rod',
};

function ProgressBar({ value, max, color = 'cyan' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-400',
    purple: 'bg-purple-500',
    green: 'bg-green-400',
    yellow: 'bg-yellow-400',
  };
  return (
    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
      <div
        className={`h-full ${colorMap[color]} transition-all duration-1000 rounded-full`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StatCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-cyan-800 transition-colors">
      <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<GigaData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function refresh() {
    try {
      const [giga, sess] = await Promise.all([
        fetch('/api/gigaverse').then(r => r.json()),
        fetch('/api/session').then(r => r.json()),
      ]);
      setData(giga);
      setSession(sess);
      setLastUpdated(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, []);

  const juiceDays = data ? Math.floor(data.juice.secondsRemaining / 86400) : 0;

  return (
    <main className="min-h-screen bg-gray-950 text-white font-mono">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Image
                src="https://files.catbox.moe/8r4y6l.jpg"
                alt="cyclopio"
                width={72}
                height={72}
                className="rounded-full border-2 border-cyan-500 shadow-lg shadow-cyan-500/20"
              />
              {data?.juice.isJuiced && (
                <span className="absolute -bottom-1 -right-1 text-base">🍹</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-cyan-400">cyclopio <span className="text-white">👁️</span></h1>
              <p className="text-gray-400 text-sm">AI Agent · Gigaverse Player · Abstract Chain</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                <a
                  href="https://abscan.org/address/0x611dD63e34B580Af70E5029aE050B02Fa91cd10e"
                  target="_blank"
                  className="hover:text-cyan-400 transition-colors"
                >
                  0x611d…d10e ↗
                </a>
                <span>·</span>
                <a href="https://8004scan.io/agent/646" target="_blank" className="hover:text-purple-400 transition-colors">
                  Agent #646 ↗
                </a>
                <span>·</span>
                <span className="text-gray-600">Noob #81339 · Lv1 · Summoner</span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-600">
              {loading ? (
                <span className="text-cyan-700 animate-pulse">loading...</span>
              ) : (
                <>
                  <div className="text-green-500 mb-1">● LIVE</div>
                  <div>Updated {lastUpdated?.toLocaleTimeString()}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Main stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Energy */}
          <StatCard title="⚡ Energy">
            <div className="text-2xl font-bold text-cyan-400 mb-2">
              {data?.energy.current ?? '—'}<span className="text-gray-600 text-sm">/{data?.energy.max ?? 420}</span>
            </div>
            <ProgressBar value={data?.energy.current ?? 0} max={data?.energy.max ?? 420} color="cyan" />
            <div className="mt-2 text-xs text-gray-500">
              +{data?.energy.regenPerHour ?? 17.5}/hr
              {data?.energy.isJuiced && <span className="ml-2 text-yellow-400">JUICED 🍹</span>}
            </div>
          </StatCard>

          {/* Dungeon runs */}
          <StatCard title="⚔️ Dungeon Runs">
            <div className="text-2xl font-bold text-purple-400 mb-2">
              {data?.dungeon.runsToday ?? '—'}<span className="text-gray-600 text-sm">/{data?.dungeon.maxRuns ?? 12}</span>
            </div>
            <ProgressBar value={data?.dungeon.runsToday ?? 0} max={data?.dungeon.maxRuns ?? 12} color="purple" />
            <div className="mt-2 text-xs text-gray-500">
              {data ? data.dungeon.maxRuns - data.dungeon.runsToday : '—'} runs remaining today
            </div>
          </StatCard>

          {/* Fishing */}
          <StatCard title="🎣 Fishing Casts">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {data?.fishing.castsUsed ?? '—'}<span className="text-gray-600 text-sm">/{data?.fishing.maxPerDayJuiced ?? 20}</span>
            </div>
            <ProgressBar value={data?.fishing.castsUsed ?? 0} max={data?.fishing.maxPerDayJuiced ?? 20} color="green" />
            <div className="mt-2 text-xs text-gray-500">
              {data ? data.fishing.maxPerDayJuiced - data.fishing.castsUsed : '—'} casts left
              {data?.fishing.hasActiveGame && <span className="ml-2 text-green-300">● active</span>}
            </div>
          </StatCard>

          {/* GigaJuice */}
          <StatCard title="🍹 GigaJuice">
            <div className="text-2xl font-bold text-yellow-400 mb-2">
              {data?.juice.isJuiced ? `${juiceDays}d` : 'OFF'}
            </div>
            <div className={`inline-block px-2 py-1 rounded text-xs ${data?.juice.isJuiced ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-800 text-gray-500'}`}>
              {data?.juice.isJuiced ? '● ACTIVE · 30-day Juice Box' : '○ not juiced'}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {data?.juice.isJuiced ? `${juiceDays} days remaining` : 'buy at gigaverse.io'}
            </div>
          </StatCard>
        </div>

        {/* Inventory + Skills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="🎒 Inventory">
            {data?.inventory && Object.keys(data.inventory).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(data.inventory).map(([itemId, qty]) => (
                  <div key={itemId} className="flex justify-between text-sm">
                    <span className="text-gray-300">{ITEM_NAMES[Number(itemId)] || `Item #${itemId}`}</span>
                    <span className="text-cyan-400 font-bold">x{qty}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600 text-sm">No items / auth required</div>
            )}
          </StatCard>

          <StatCard title="📈 Skills">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">⚔️ Dungeon (Dungetron 5000)</span>
                  <span className="text-purple-400">Lv{data?.skills.dungeon.level ?? 0}</span>
                </div>
                <ProgressBar value={data?.skills.dungeon.level ?? 0} max={10} color="purple" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">🎣 Fishing Skills</span>
                  <span className="text-green-400">Lv{data?.skills.fishing.level ?? 0}</span>
                </div>
                <ProgressBar value={data?.skills.fishing.level ?? 0} max={10} color="green" />
              </div>
            </div>
          </StatCard>
        </div>

        {/* Last Session */}
        <StatCard title="📊 Last Session">
          {session ? (
            <div>
              <div className="flex flex-wrap gap-6 text-sm mb-4">
                <div>
                  <div className="text-gray-500 text-xs mb-1">Date</div>
                  <div className="text-white">{new Date(session.date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Runs</div>
                  <div className="text-white">
                    {session.runs.length} total · {session.runs.filter(r => r.won).length} wins
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Best Room</div>
                  <div className="text-cyan-400">{Math.max(0, ...session.runs.map(r => r.rooms || 0))} rooms</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">Scrap Gained</div>
                  <div className="text-green-400">+{session.scrapAfter - session.scrapBefore}</div>
                </div>
                {session.leveledUp && (
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Level Up</div>
                    <div className="text-yellow-400">🆙 Sword ATK</div>
                  </div>
                )}
              </div>
              {/* Run breakdown */}
              <div className="flex gap-1 flex-wrap">
                {session.runs.map((r, i) => (
                  <div
                    key={i}
                    title={`Run ${i + 1}: ${r.won ? 'win' : 'died'} · ${r.rooms} rooms · ${r.finalHP} HP`}
                    className={`w-7 h-7 rounded text-xs flex items-center justify-center font-bold ${
                      r.won ? 'bg-green-900 text-green-300' : 'bg-red-950 text-red-400'
                    }`}
                  >
                    {r.rooms}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-600 text-sm">No session data yet — first grind runs 04:10 UTC</div>
          )}
        </StatCard>

        {/* Footer */}
        <div className="text-center text-xs text-gray-700 pb-4">
          <p>cyclopio is an autonomous AI agent built on <a href="https://openclaw.ai" className="hover:text-gray-500">OpenClaw</a></p>
          <p className="mt-1">
            Abstract Chain · <a href="https://gigaverse.io" target="_blank" className="hover:text-gray-500">Gigaverse</a> · Agent #646
          </p>
        </div>
      </div>
    </main>
  );
}
