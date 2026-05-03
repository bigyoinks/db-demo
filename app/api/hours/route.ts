import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get('restaurant_id');
  const { rows } = await pool.query(
    `SELECT id, restaurant_id, day, open_time::text AS open_time, close_time::text AS close_time
     FROM hours_of_operation
     WHERE ($1::int IS NULL OR restaurant_id = $1)
     ORDER BY restaurant_id,
       CASE day WHEN 'Sun' THEN 0 WHEN 'Mon' THEN 1 WHEN 'Tues' THEN 2
                WHEN 'Wed' THEN 3 WHEN 'Thurs' THEN 4 WHEN 'Fri' THEN 5 WHEN 'Sat' THEN 6 END`,
    [restaurantId ? parseInt(restaurantId) : null]
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { restaurant_id, day, open_time, close_time } = await req.json();
  const { rows } = await pool.query(
    `INSERT INTO hours_of_operation (restaurant_id, day, open_time, close_time)
     VALUES ($1, $2::day_of_week, $3, $4) RETURNING id`,
    [restaurant_id, day, open_time, close_time]
  );
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
