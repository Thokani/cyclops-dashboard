import { NextResponse } from 'next/server';

// Session history is pushed here by the daily cron script
// For now returns placeholder — will be populated after first daily run
export async function GET() {
  return NextResponse.json(null);
}
