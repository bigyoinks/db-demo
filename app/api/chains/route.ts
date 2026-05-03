import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const { rows } = await pool.query(`
    SELECT id, name, cuisine, price_range, ROUND(avg_rating::numeric, 2) AS avg_rating
    FROM restaurant_chain
    ORDER BY avg_rating DESC NULLS LAST, name ASC
  `);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { name, cuisine, price_range } = await req.json();
  const { rows } = await pool.query(
    `INSERT INTO restaurant_chain (name, cuisine, price_range) VALUES ($1, $2, $3) RETURNING *`,
    [name, cuisine, price_range]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
