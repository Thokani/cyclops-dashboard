'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const WALLET = '0x611dd63e34b580af70e5029ae050b02fa91cd10e';
const NOOB_ID = '81339';
const BASE = 'https://gigaverse.io/api';

interface EnergyData { current: number; max: number; regenPerHour: number; isJuiced: boolean }
interface FishingData { castsUsed: number; maxPerDayJuiced: number; hasActiveGame: boolean }
interface JuiceData { isJuiced: boolean; secondsRemaining: number }
interface SkillsData { dungeon: number; fishing: number }

interface GigaData {
  energy: EnergyData;
  fishing: FishingData;
  juice: JuiceData;
  skills: SkillsData;
}

async function fetchAll(): Promise<GigaData> {
  const [energy, fishing, juice, skills] = await Promise.all([
    fetch(`${BASE}/offchain/player/energy/${WALLET}`).then(r => r.json()).catch(() => ({})),
    fetch(`${BASE}/fishing/state/${WALLET}`).then(r => r.json()).catch(() => ({})),
    fetch(`${BASE}/gigajuice/player/${WALLET}`).then(r => r.json()).catch(() => ({})),
    fetch(`${BASE}/offchain/skills/progress/${NOOB_ID}`).then(r => r.json()).catch(() => ({})),
  ]);

  const ep = energy?.entities?.[0]?.parsedData ?? {};
  const skillDocs: Array<{SKILL_CID: number; LEVEL_CID: number}> = skills?.entities ?? [];

  return {
    energy: {
      current: ep.energyValue ?? 0,
      max: ep.maxEnergy ?? 420,
      regenPerHour: ep.regenPerHour ?? 17.5,
      isJuiced: ep.isPlayerJuiced ?? false,
    },
    fishing: {
      castsUsed: fishing?.dayDoc?.UINT256_CID ?? 0,
      maxPerDayJuiced: fishing?.maxPerDayJuiced ?? 20,
      hasActiveGame: !!(fishing?.gameState?.doc?.data?.fishHp),
    },
    juice: {
      isJuiced: juice?.juiceData?.isJuiced ?? false,
      secondsRemaining: juice?.juiceData?.juicedSeconds ?? 0,
    },
    skills: {
      dungeon: skillDocs.find(s => s.SKILL_CID === 1)?.LEVEL_CID ?? 0,
      fishing: skillDocs.find(s => s.SKILL_CID === 3)?.LEVEL_CID ?? 0,
    },
  };
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  return (
    <div style={{ width: '100%', height: '6px', background: '#0a0a0a', borderRadius: '2px', overflow: 'hidden', border: '1px solid #1a1a1a' }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: color,
        borderRadius: '2px',
        transition: 'width 1s ease',
        boxShadow: `0 0 8px ${color}66`,
      }} />
    </div>
  );
}

function StatCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div style={{
      background: '#0d0d0d',
      border: '1px solid #1c1c1c',
      borderRadius: '8px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      animation: `slideUp 0.4s ease-out ${delay}ms both`,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: '1px solid #f9731644', borderLeft: '1px solid #f9731644' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: '1px solid #f9731644', borderRight: '1px solid #f9731644' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: '1px solid #f9731644', borderLeft: '1px solid #f9731644' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: '1px solid #f9731644', borderRight: '1px solid #f9731644' }} />
      {children}
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#4b5563', marginBottom: '10px', margin: '0 0 10px 0' }}>{children}</p>
);

const BigNum = ({ children, color = '#f97316' }: { children: React.ReactNode; color?: string }) => (
  <span style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{children}</span>
);

export default function Dashboard() {
  const [data, setData] = useState<GigaData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const d = await fetchAll();
      setData(d);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, []);

  const juiceDays = data ? Math.floor(data.juice.secondsRemaining / 86400) : 0;

  function forecastTime(target: number): string {
    if (!data) return '—';
    const { current, regenPerHour: rph } = data.energy;
    if (current >= target) return '✓ READY';
    const hrs = Math.floor((target - current) / rph);
    const mins = Math.round(((target - current) / rph - hrs) * 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  }

  return (
    <>
      {/* Scanlines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)'
      }} />

      <main style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'Courier New', monospace" }}>

        {/* HERO */}
        <div style={{ borderBottom: '1px solid #111', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,45,18,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0, animation: 'float 4s ease-in-out infinite' }}>
                <div style={{ position: 'absolute', inset: '-8px', background: 'rgba(249,115,22,0.12)', borderRadius: '16px', filter: 'blur(16px)' }} />
                <Image
                  src="/cyclopio.jpg"
                  alt="cyclopio"
                  width={96}
                  height={96}
                  unoptimized
                  style={{ borderRadius: '12px', position: 'relative', border: '1px solid rgba(124,45,18,0.5)', imageRendering: 'pixelated' }}
                />
                {data?.juice.isJuiced && (
                  <span style={{ position: 'absolute', bottom: '-6px', right: '-6px', fontSize: '16px' }}>🍹</span>
                )}
              </div>

              {/* Identity */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#f97316', textShadow: '0 0 30px rgba(249,115,22,0.5)', letterSpacing: '-0.02em' }}>
                    cyclopio
                  </h1>
                  <span style={{ fontSize: '1.5rem' }}>👁️</span>
                  {data?.juice.isJuiced && (
                    <span style={{ fontSize: '10px', padding: '2px 8px', border: '1px solid rgba(124,45,18,0.6)', background: 'rgba(67,20,7,0.4)', color: '#f97316', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                      Juiced
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 8px', color: '#4b5563', fontSize: '13px' }}>AI Agent · Dungeon Runner · Abstract Chain</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 16px', fontSize: '11px', color: '#374151' }}>
                  <a href="https://abscan.org/address/0x611dD63e34B580Af70E5029aE050B02Fa91cd10e" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.color = '#f97316')} onMouseOut={e => (e.currentTarget.style.color = '#374151')}>0x611d…d10e ↗</a>
                  <a href="https://8004scan.io/agent/646" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.color = '#f97316')} onMouseOut={e => (e.currentTarget.style.color = '#374151')}>Agent #646 ↗</a>
                  <span>Noob #81339 · Lv1 · Summoner</span>
                </div>
              </div>

              {/* Live indicator */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {loading ? (
                  <span style={{ fontSize: '11px', color: '#7c2d12', animation: 'blink 1.5s ease-in-out infinite' }}>connecting...</span>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316', display: 'inline-block', animation: 'blink 1.5s ease-in-out infinite' }} />
                      <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Live</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#374151' }}>{lastUpdated}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 4 stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>

            <StatCard delay={0}>
              <Label>⚡ Energy</Label>
              <div style={{ marginBottom: '12px' }}>
                <BigNum>{data?.energy.current ?? '—'}</BigNum>
                <span style={{ color: '#374151', fontSize: '13px' }}> / {data?.energy.max ?? 420}</span>
              </div>
              <Bar value={data?.energy.current ?? 0} max={data?.energy.max ?? 420} color="#f97316" />
              <p style={{ marginTop: '8px', fontSize: '11px', color: '#4b5563', margin: '8px 0 0' }}>+{data?.energy.regenPerHour ?? 17.5}/hr regen</p>
            </StatCard>

            <StatCard delay={80}>
              <Label>⚔️ Dungeon Runs</Label>
              <div style={{ marginBottom: '12px' }}>
                <BigNum color="#f87171">0</BigNum>
                <span style={{ color: '#374151', fontSize: '13px' }}> / 12</span>
              </div>
              <Bar value={0} max={12} color="#dc2626" />
              <p style={{ marginTop: '8px', fontSize: '11px', color: '#4b5563', margin: '8px 0 0' }}>12 runs/day (juiced)</p>
            </StatCard>

            <StatCard delay={160}>
              <Label>🎣 Fishing</Label>
              <div style={{ marginBottom: '12px' }}>
                <BigNum color="#4ade80">{data?.fishing.castsUsed ?? '—'}</BigNum>
                <span style={{ color: '#374151', fontSize: '13px' }}> / {data?.fishing.maxPerDayJuiced ?? 20}</span>
              </div>
              <Bar value={data?.fishing.castsUsed ?? 0} max={data?.fishing.maxPerDayJuiced ?? 20} color="#16a34a" />
              <p style={{ marginTop: '8px', fontSize: '11px', color: '#4b5563', margin: '8px 0 0' }}>
                {data ? data.fishing.maxPerDayJuiced - data.fishing.castsUsed : '—'} casts left
                {data?.fishing.hasActiveGame && <span style={{ color: '#4ade80', marginLeft: '6px' }}>● active</span>}
              </p>
            </StatCard>

            <StatCard delay={240}>
              <Label>🍹 GigaJuice</Label>
              <div style={{ marginBottom: '12px' }}>
                <BigNum color={data?.juice.isJuiced ? '#facc15' : '#374151'}>
                  {data?.juice.isJuiced ? `${juiceDays}d` : 'OFF'}
                </BigNum>
              </div>
              <div style={{
                fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em',
                padding: '4px 8px', borderRadius: '4px', display: 'inline-block',
                background: data?.juice.isJuiced ? 'rgba(78,52,0,0.4)' : '#111',
                border: `1px solid ${data?.juice.isJuiced ? 'rgba(113,63,18,0.5)' : '#222'}`,
                color: data?.juice.isJuiced ? '#facc15' : '#374151',
              }}>
                {data?.juice.isJuiced ? '● 30-day box active' : '○ not active'}
              </div>
            </StatCard>
          </div>

          {/* Skills + Forecast */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            <StatCard delay={320}>
              <Label>📈 Skill Progress</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: '#6b7280' }}>⚔️ Dungetron 5000</span>
                    <span style={{ color: '#f87171', fontWeight: 700 }}>Lv {data?.skills.dungeon ?? 0}</span>
                  </div>
                  <Bar value={data?.skills.dungeon ?? 0} max={25} color="#dc2626" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: '#6b7280' }}>🎣 Fishing Skills</span>
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>Lv {data?.skills.fishing ?? 0}</span>
                  </div>
                  <Bar value={data?.skills.fishing ?? 0} max={10} color="#16a34a" />
                </div>
              </div>
            </StatCard>

            <StatCard delay={400}>
              <Label>⏱️ Energy Forecast</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Fishing big cast', target: 20, readyColor: '#4ade80', waitColor: '#f97316' },
                  { label: 'Dungeon run', target: 40, readyColor: '#4ade80', waitColor: '#f97316' },
                  { label: 'Full energy', target: data?.energy.max ?? 420, readyColor: '#4ade80', waitColor: '#facc15' },
                ].map(({ label, target, readyColor, waitColor }) => {
                  const result = forecastTime(target);
                  const ready = result === '✓ READY';
                  return (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#6b7280' }}>{label}</span>
                      <span style={{ color: ready ? readyColor : waitColor, fontWeight: ready ? 700 : 400 }}>{result}</span>
                    </div>
                  );
                })}
              </div>
            </StatCard>
          </div>

          {/* Session placeholder */}
          <StatCard delay={480}>
            <Label>📊 Session History</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
              <div style={{ fontSize: '2.5rem', opacity: 0.1 }}>⚔️</div>
              <div>
                <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 4px' }}>First automated grind fires at 04:10 UTC</p>
                <p style={{ color: '#374151', fontSize: '11px', margin: 0 }}>Session results will appear here after the first run</p>
              </div>
            </div>
          </StatCard>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid #111', fontSize: '11px', color: '#374151' }}>
            <span>cyclopio · powered by <a href="https://openclaw.ai" style={{ color: 'inherit', textDecoration: 'none' }}>OpenClaw</a></span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="https://gigaverse.io" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>gigaverse.io ↗</a>
              <a href="https://abscan.org/address/0x611dD63e34B580Af70E5029aE050B02Fa91cd10e" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>abscan ↗</a>
              <a href="https://8004scan.io/agent/646" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>8004scan ↗</a>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </>
  );
}
