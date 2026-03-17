import { NextResponse } from 'next/server';
import { startCronJobs } from '@/lib/cron';

// This route is called once on app start to initialise background jobs
export async function GET() {
  await startCronJobs();
  return NextResponse.json({ ok: true });
}
