import { NextResponse } from 'next/server';

const WALLET = '0x611dd63e34b580af70e5029ae050b02fa91cd10e';
const NOOB_ID = '81339';
const BASE = 'https://gigaverse.io/api';

async function fetchSafe(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const [energyData, fishingState, juiceData, skillsProgress] = await Promise.all([
    fetchSafe(`${BASE}/offchain/player/energy/${WALLET}`),
    fetchSafe(`${BASE}/fishing/state/${WALLET}`),
    fetchSafe(`${BASE}/gigajuice/player/${WALLET}`),
    fetchSafe(`${BASE}/offchain/skills/progress/${NOOB_ID}`),
  ]);

  const energyParsed = energyData?.entities?.[0]?.parsedData || {};
  const skillDocs = skillsProgress?.entities || [];
  const dungeonSkill = skillDocs.find((s: { SKILL_CID: number }) => s.SKILL_CID === 1);
  const fishingSkill = skillDocs.find((s: { SKILL_CID: number }) => s.SKILL_CID === 3);

  return NextResponse.json({
    timestamp: Date.now(),
    energy: {
      current: energyParsed.energyValue || 0,
      max: energyParsed.maxEnergy || 420,
      regenPerHour: energyParsed.regenPerHour || 17.5,
      isJuiced: energyParsed.isPlayerJuiced || false,
    },
    fishing: {
      castsUsed: fishingState?.dayDoc?.UINT256_CID || 0,
      maxPerDay: fishingState?.maxPerDay || 10,
      maxPerDayJuiced: fishingState?.maxPerDayJuiced || 20,
      hasActiveGame: !!fishingState?.gameState?.doc?.data?.fishHp,
    },
    juice: {
      isJuiced: juiceData?.juiceData?.isJuiced || false,
      secondsRemaining: juiceData?.juiceData?.juicedSeconds || 0,
    },
    skills: {
      dungeon: { level: dungeonSkill?.LEVEL_CID || 0 },
      fishing: { level: fishingSkill?.LEVEL_CID || 0 },
    },
  });
}
