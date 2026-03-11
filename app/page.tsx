'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

const WALLET = '0x611dd63e34b580af70e5029ae050b02fa91cd10e';
const NOOB_ID = '81339';
const BASE = 'https://gigaverse.io/api';
const CYCLOPS_CA = 'TBA'; // placeholder — update with real CA

interface GigaData {
  energy: { current: number; max: number; regenPerHour: number; isJuiced: boolean };
  fishing: { castsUsed: number; maxPerDayJuiced: number; hasActiveGame: boolean };
  juice: { isJuiced: boolean; secondsRemaining: number };
  skills: { dungeon: number; fishing: number };
}

async function fetchAll(): Promise<GigaData> {
  const [energy, fishing, juice, skills] = await Promise.all([
    fetch(`${BASE}/offchain/player/energy/${WALLET}`).then(r => r.json()).catch(() => ({})),
    fetch(`${BASE}/fishing/state/${WALLET}`).then(r => r.json()).catch(() => ({})),
    fetch(`${BASE}/gigajuice/player/${WALLET}`).then(r => r.json()).catch(() => ({})),
    fetch(`${BASE}/offchain/skills/progress/${NOOB_ID}`).then(r => r.json()).catch(() => ({})),
  ]);
  const ep = energy?.entities?.[0]?.parsedData ?? {};
  const skillDocs: Array<{ SKILL_CID: number; LEVEL_CID: number }> = skills?.entities ?? [];
  return {
    energy: {
      current: Math.round(ep.energyValue ?? 0),
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

function useCountUp(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

function Bar({ value, max, color, glow }: { value: number; max: number; color: string; glow: string }) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  return (
    <div style={{ width: '100%', height: '6px', background: '#0a0a0a', borderRadius: '3px', overflow: 'hidden', border: '1px solid #1a1a1a', position: 'relative' }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: color,
        borderRadius: '3px', transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: `0 0 10px ${glow}`,
        position: 'relative',
      }}>
        {pct > 5 && (
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '20px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15))',
          }} />
        )}
      </div>
    </div>
  );
}

function Card({ children, delay = 0, onClick, href }: {
  children: React.ReactNode; delay?: number;
  onClick?: () => void; href?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const el = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: hovered ? '#111' : '#0d0d0d',
        border: `1px solid ${hovered ? '#2a2a2a' : '#1c1c1c'}`,
        borderRadius: '10px', padding: '20px', position: 'relative', overflow: 'hidden',
        animation: `slideUp 0.4s ease-out ${delay}ms both`,
        cursor: onClick || href ? 'pointer' : 'default',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Corner accents */}
      {['top-left','top-right','bottom-left','bottom-right'].map(pos => (
        <div key={pos} style={{
          position: 'absolute',
          top: pos.includes('top') ? 0 : 'auto',
          bottom: pos.includes('bottom') ? 0 : 'auto',
          left: pos.includes('left') ? 0 : 'auto',
          right: pos.includes('right') ? 0 : 'auto',
          width: 12, height: 12,
          borderTop: pos.includes('top') ? `1px solid ${hovered ? '#f9731666' : '#f9731633'}` : 'none',
          borderBottom: pos.includes('bottom') ? `1px solid ${hovered ? '#f9731666' : '#f9731633'}` : 'none',
          borderLeft: pos.includes('left') ? `1px solid ${hovered ? '#f9731666' : '#f9731633'}` : 'none',
          borderRight: pos.includes('right') ? `1px solid ${hovered ? '#f9731666' : '#f9731633'}` : 'none',
          transition: 'border-color 0.2s',
        }} />
      ))}
      {/* Subtle top gradient on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, #f9731644, transparent)',
        }} />
      )}
      {children}
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>{el}</a>;
  return el;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    if (text === 'TBA') return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);
  return (
    <button onClick={copy} style={{
      background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.1)',
      border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.2)'}`,
      color: copied ? '#4ade80' : '#f97316', borderRadius: '4px',
      padding: '3px 10px', fontSize: '11px', cursor: 'pointer',
      letterSpacing: '0.05em', transition: 'all 0.2s',
      fontFamily: "'Courier New', monospace",
    }}>
      {copied ? '✓ copied' : 'copy'}
    </button>
  );
}

function LiveCountdown({ targetHour = 4, targetMin = 10 }: { targetHour?: number; targetMin?: number }) {
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    function update() {
      const now = new Date();
      const next = new Date(now);
      next.setUTCHours(targetHour, targetMin, 0, 0);
      if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeStr(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [targetHour, targetMin]);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>;
}

export default function Dashboard() {
  const [data, setData] = useState<GigaData | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'skills' | 'token'>('overview');

  const energyAnimated = useCountUp(data?.energy.current ?? 0);

  async function refresh() {
    try {
      const d = await fetchAll();
      setData(d);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, []);

  function forecastTime(target: number) {
    if (!data) return '—';
    const { current, regenPerHour: rph } = data.energy;
    if (current >= target) return '✓ READY';
    const mins = Math.ceil((target - current) / rph * 60);
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  const juiceDays = data ? Math.floor(data.juice.secondsRemaining / 86400) : 0;

  const s = {
    label: (extra?: React.CSSProperties): React.CSSProperties => ({
      fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em',
      color: '#4b5563', margin: '0 0 10px 0', ...extra,
    }),
    bignum: (color = '#f97316'): React.CSSProperties => ({
      fontSize: '2.2rem', fontWeight: 700, color, lineHeight: 1,
    }),
    muted: (extra?: React.CSSProperties): React.CSSProperties => ({
      fontSize: '11px', color: '#374151', margin: 0, ...extra,
    }),
    tag: (color = '#f97316', bg = 'rgba(67,20,7,0.4)', border = 'rgba(124,45,18,0.5)'): React.CSSProperties => ({
      fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em',
      padding: '3px 10px', borderRadius: '4px', border: `1px solid ${border}`,
      background: bg, color, display: 'inline-block',
    }),
  } as const;

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50,
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)',
      }} />

      <main style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: "'Courier New', monospace" }}>

        {/* ═══ HERO ═══ */}
        <div style={{ borderBottom: '1px solid #111', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 300px at 80% 50%, rgba(124,45,18,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', background: 'rgba(249,115,22,0.04)', borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '920px', margin: '0 auto', padding: '28px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0, animation: 'float 4s ease-in-out infinite' }}>
                <div style={{ position: 'absolute', inset: '-12px', background: 'rgba(249,115,22,0.1)', borderRadius: '20px', filter: 'blur(20px)' }} />
                <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(249,115,22,0.25)', boxShadow: '0 0 30px rgba(249,115,22,0.15)' }}>
                  <Image src="/cyclopio.jpg" alt="cyclopio" width={100} height={100} unoptimized style={{ display: 'block', imageRendering: 'pixelated' }} />
                </div>
                {data?.juice.isJuiced && (
                  <span style={{ position: 'absolute', bottom: '-8px', right: '-8px', fontSize: '18px', filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.5))' }}>🍹</span>
                )}
              </div>

              {/* Identity */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 700, color: '#f97316', textShadow: '0 0 40px rgba(249,115,22,0.4)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    cyclopio
                  </h1>
                  <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))' }}>👁️</span>
                  {data?.juice.isJuiced && <span style={s.tag()}>⚡ Juiced</span>}
                  <span style={s.tag('#a78bfa', 'rgba(76,29,149,0.3)', 'rgba(109,40,217,0.4)')}>Summoner</span>
                </div>
                <p style={{ margin: '0 0 10px', color: '#6b7280', fontSize: '13px' }}>
                  AI Agent · Abstract Chain · Gigaverse Dungeon Runner
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 16px', fontSize: '11px' }}>
                  {[
                    { label: '0x611d…d10e', href: `https://abscan.org/address/${WALLET}` },
                    { label: 'Agent #646', href: 'https://8004scan.io/agents/646' },
                    { label: 'Noob #81339 · Lv1', href: 'https://gigaverse.io' },
                  ].map(({ label, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#4b5563', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseOver={e => (e.currentTarget.style.color = '#f97316')}
                      onMouseOut={e => (e.currentTarget.style.color = '#4b5563')}
                    >{label} ↗</a>
                  ))}
                </div>
              </div>

              {/* Live + Next cron */}
              <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '120px' }}>
                {loading ? (
                  <span style={{ fontSize: '11px', color: '#7c2d12', animation: 'blink 1.5s ease-in-out infinite' }}>connecting...</span>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f97316', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                      <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Live</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#374151' }}>{lastUpdated}</div>
                    <div style={{ marginTop: '8px', fontSize: '10px', color: '#374151' }}>
                      Next grind in<br />
                      <span style={{ color: '#f97316', fontWeight: 700, fontSize: '13px' }}>
                        <LiveCountdown targetHour={4} targetMin={10} />
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ TABS ═══ */}
        <div style={{ borderBottom: '1px solid #111' }}>
          <div style={{ maxWidth: '920px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '0' }}>
            {(['overview', 'skills', 'token'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '14px 20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em',
                color: tab === t ? '#f97316' : '#4b5563',
                borderBottom: `2px solid ${tab === t ? '#f97316' : 'transparent'}`,
                fontFamily: "'Courier New', monospace",
                transition: 'all 0.2s',
              }}
                onMouseOver={e => { if (tab !== t) (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
                onMouseOut={e => { if (tab !== t) (e.currentTarget as HTMLElement).style.color = '#4b5563'; }}
              >
                {t === 'overview' ? '⚔️ Overview' : t === 'skills' ? '📈 Skills' : '🐱 $CYCLOPS'}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{ maxWidth: '920px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {tab === 'overview' && (
            <>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>

                <Card delay={0}>
                  <p style={s.label()}>⚡ Energy</p>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={s.bignum()}>{energyAnimated}</span>
                    <span style={{ color: '#374151', fontSize: '13px' }}>/ {data?.energy.max ?? 420}</span>
                  </div>
                  <Bar value={data?.energy.current ?? 0} max={data?.energy.max ?? 420} color="linear-gradient(90deg,#c2410c,#f97316)" glow="rgba(249,115,22,0.4)" />
                  <p style={{ ...s.muted(), marginTop: '8px' }}>+{data?.energy.regenPerHour ?? 17.5}/hr · {data?.juice.isJuiced ? 'juiced' : 'normal'}</p>
                </Card>

                <Card delay={70}>
                  <p style={s.label()}>⚔️ Dungeon Runs</p>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={s.bignum('#f87171')}>0</span>
                    <span style={{ color: '#374151', fontSize: '13px' }}>/ 12 today</span>
                  </div>
                  <Bar value={0} max={12} color="linear-gradient(90deg,#991b1b,#dc2626)" glow="rgba(220,38,38,0.4)" />
                  <p style={{ ...s.muted(), marginTop: '8px' }}>Next grind: 04:10 UTC</p>
                </Card>

                <Card delay={140}>
                  <p style={s.label()}>🎣 Fishing Casts</p>
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={s.bignum('#4ade80')}>{data?.fishing.castsUsed ?? '—'}</span>
                    <span style={{ color: '#374151', fontSize: '13px' }}>/ {data?.fishing.maxPerDayJuiced ?? 20}</span>
                  </div>
                  <Bar value={data?.fishing.castsUsed ?? 0} max={data?.fishing.maxPerDayJuiced ?? 20} color="linear-gradient(90deg,#166534,#16a34a)" glow="rgba(22,163,74,0.4)" />
                  <p style={{ ...s.muted(), marginTop: '8px' }}>
                    {data ? data.fishing.maxPerDayJuiced - data.fishing.castsUsed : '—'} left
                    {data?.fishing.hasActiveGame && <span style={{ color: '#4ade80', marginLeft: '6px' }}>● casting</span>}
                  </p>
                </Card>

                <Card delay={210}>
                  <p style={s.label()}>🍹 GigaJuice</p>
                  <div style={{ marginBottom: '14px' }}>
                    <span style={s.bignum(data?.juice.isJuiced ? '#facc15' : '#374151')}>
                      {data?.juice.isJuiced ? `${juiceDays}d` : 'OFF'}
                    </span>
                  </div>
                  <div style={s.tag(
                    data?.juice.isJuiced ? '#facc15' : '#374151',
                    data?.juice.isJuiced ? 'rgba(78,52,0,0.4)' : '#111',
                    data?.juice.isJuiced ? 'rgba(113,63,18,0.5)' : '#222',
                  )}>
                    {data?.juice.isJuiced ? '● 30-day box active' : '○ not active'}
                  </div>
                </Card>
              </div>

              {/* Energy forecast */}
              <Card delay={280}>
                <p style={s.label()}>⏱️ Energy Forecast</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  {[
                    { label: 'Fishing big cast', target: 20, icon: '🎣' },
                    { label: 'Dungeon run', target: 40, icon: '⚔️' },
                    { label: 'Full energy', target: data?.energy.max ?? 420, icon: '⚡' },
                  ].map(({ label, target, icon }) => {
                    const result = forecastTime(target);
                    const ready = result === '✓ READY';
                    return (
                      <div key={label} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '12px' }}>
                        <div style={{ fontSize: '18px', marginBottom: '6px' }}>{icon}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: ready ? '#4ade80' : '#f97316' }}>{result}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Session history */}
              <Card delay={350}>
                <p style={s.label()}>📊 Session History</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
                  <div style={{ fontSize: '3rem', opacity: 0.08, userSelect: 'none' }}>⚔️</div>
                  <div>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 4px' }}>Automated grind fires daily at 04:10 UTC</p>
                    <p style={s.muted()}>Session results — rooms cleared, loot, level-ups — will appear here</p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {tab === 'skills' && (
            <>
              <Card delay={0}>
                <p style={s.label()}>⚔️ Dungeon Skills</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { name: 'Dungetron 5000', level: data?.skills.dungeon ?? 0, max: 25, color: 'linear-gradient(90deg,#991b1b,#dc2626)', glow: 'rgba(220,38,38,0.4)', icon: '🗡️' },
                  ].map(({ name, level, max, color, glow, icon }) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>{icon} {name}</span>
                        <span style={{ fontWeight: 700, color: '#f87171', fontSize: '14px' }}>Lv {level} <span style={{ color: '#374151', fontWeight: 400 }}>/ {max}</span></span>
                      </div>
                      <Bar value={level} max={max} color={color} glow={glow} />
                    </div>
                  ))}
                </div>
              </Card>

              <Card delay={80}>
                <p style={s.label()}>🎣 Fishing Skills</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { name: 'Stamana (mana)', level: 0, max: 10, color: 'linear-gradient(90deg,#166534,#16a34a)', glow: 'rgba(22,163,74,0.4)', icon: '💧', note: 'Priority 1' },
                    { name: 'Luck (rarity)', level: 0, max: 10, color: 'linear-gradient(90deg,#854d0e,#ca8a04)', glow: 'rgba(202,138,4,0.4)', icon: '🍀', note: 'Priority 2' },
                    { name: 'Fintuition (predict)', level: 0, max: 10, color: 'linear-gradient(90deg,#1e40af,#3b82f6)', glow: 'rgba(59,130,246,0.4)', icon: '🔮', note: 'Priority 3' },
                    { name: 'Rod Control (crit)', level: 0, max: 10, color: 'linear-gradient(90deg,#6b21a8,#a855f7)', glow: 'rgba(168,85,247,0.4)', icon: '🎯', note: 'Priority 4' },
                  ].map(({ name, level, max, color, glow, icon, note }) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#9ca3af' }}>{icon} {name}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', color: '#374151' }}>{note}</span>
                          <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '14px' }}>Lv {level} <span style={{ color: '#374151', fontWeight: 400 }}>/ {max}</span></span>
                        </div>
                      </div>
                      <Bar value={level} max={max} color={color} glow={glow} />
                    </div>
                  ))}
                </div>
              </Card>

              <Card delay={160}>
                <p style={s.label()}>⚔️ Build — Stat Allocations</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '4px' }}>
                  {[
                    { stat: 'Max HP', value: '+2', level: 1, color: '#ef4444', note: 'Lv1 (respec needed)' },
                    { stat: 'Sword ATK', value: '+0', level: 0, color: '#f97316', note: 'Target: Lv2+' },
                    { stat: 'Max AMR', value: '+0', level: 0, color: '#a78bfa', note: 'Target: Lv3+' },
                  ].map(({ stat, value, color, note }) => (
                    <div key={stat} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{stat}</div>
                      <div style={{ fontSize: '10px', color: '#4b5563' }}>{note}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {tab === 'token' && (
            <>
              <Card delay={0}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <Image src="/cyclopio.jpg" alt="$CYCLOPS" width={56} height={56} unoptimized style={{ borderRadius: '8px', border: '1px solid rgba(249,115,22,0.3)' }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#f97316' }}>$CYCLOPS</h2>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>Dith&apos;s Cat · Abstract Chain · Meme Token</p>
                  </div>
                </div>

                <p style={s.label()}>Contract Address</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '10px 14px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af', flex: 1, minWidth: '120px', wordBreak: 'break-all' }}>
                    {CYCLOPS_CA === 'TBA' ? '🔒 Contract address coming soon' : CYCLOPS_CA}
                  </span>
                  <CopyButton text={CYCLOPS_CA} />
                </div>

                <p style={s.label()}>About</p>
                <p style={{ color: '#9ca3af', fontSize: '13px', lineHeight: 1.7, margin: '0 0 20px' }}>
                  $CYCLOPS is a meme token on Abstract Chain built around cyclopio — the one-eyed cat spirit AI agent. 
                  Cyclopio grinds Gigaverse dungeons and fishes daily, onchain, autonomously. All activity is verifiable on-chain.
                </p>

                <p style={s.label()}>Links</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  {[
                    { label: '🔍 abscan', href: `https://abscan.org/address/${WALLET}` },
                    { label: '🤖 8004scan', href: 'https://8004scan.io/agents/646' },
                    { label: '⚔️ Gigaverse', href: 'https://gigaverse.io' },
                    { label: '🌐 Abstract', href: 'https://abs.xyz' },
                  ].map(({ label, href }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px',
                        padding: '12px', textAlign: 'center', fontSize: '12px', color: '#6b7280',
                        transition: 'all 0.2s', cursor: 'pointer',
                      }}
                        onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f9731644'; (e.currentTarget as HTMLElement).style.color = '#f97316'; }}
                        onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                      >{label} ↗</div>
                    </a>
                  ))}
                </div>
              </Card>

              <Card delay={80}>
                <p style={s.label()}>📊 Agent Stats (onchain)</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  {[
                    { label: 'Agent ID', value: '#646', color: '#f97316' },
                    { label: 'Noob ID', value: '#81339', color: '#a78bfa' },
                    { label: 'Faction', value: 'Summoner', color: '#60a5fa' },
                    { label: 'GigaJuice', value: data?.juice.isJuiced ? `${juiceDays}d left` : 'OFF', color: '#facc15' },
                    { label: 'Level', value: 'Lv 1', color: '#4ade80' },
                    { label: 'HP', value: '14 / 14', color: '#f87171' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '16px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
                      <div style={{ fontSize: '10px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid #111', fontSize: '11px', color: '#374151' }}>
            <span>cyclopio 👁️ · powered by <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#f9731666', textDecoration: 'none' }}>OpenClaw</a></span>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { label: 'gigaverse.io', href: 'https://gigaverse.io' },
                { label: 'abscan', href: `https://abscan.org/address/${WALLET}` },
                { label: '8004scan #646', href: 'https://8004scan.io/agents/646' },
                { label: 'abstract', href: 'https://abs.xyz' },
              ].map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#374151', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#f97316')}
                  onMouseOut={e => (e.currentTarget.style.color = '#374151')}
                >{label} ↗</a>
              ))}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.4)} 50%{box-shadow:0 0 0 6px rgba(249,115,22,0)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #080808; } ::-webkit-scrollbar-thumb { background: #1c1c1c; border-radius: 3px; }
        a { color: inherit; }
      `}</style>
    </>
  );
}
