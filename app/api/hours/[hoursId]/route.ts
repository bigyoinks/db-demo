import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ hoursId: string }> }) {
  const { hoursId } = await params;
  const { day, open_time, close_time } = await req.json();
  await pool.query(
    `UPDATE hours_of_operation SET day=$1::day_of_week, open_time=$2, close_time=$3 WHERE id=$4`,
    [day, open_time, close_time, hoursId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ hoursId: string }> }) {
  const { hoursId } = await params;
  await pool.query(`DELETE FROM hours_of_operation WHERE id=$1`, [hoursId]);
  return NextResponse.json({ ok: true });
}
