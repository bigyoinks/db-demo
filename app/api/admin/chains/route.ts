import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const { rows } = await pool.query(`
    SELECT rc.id, rc.name, rc.cuisine, rc.price_range::text,
           ROUND(rc.avg_rating::numeric, 2) AS avg_rating,
           COUNT(r.id) AS location_count
    FROM restaurant_chain rc
    LEFT JOIN restaurant r ON r.chain_id = rc.id
    GROUP BY rc.id
    ORDER BY rc.name ASC
  `);
  return NextResponse.json(rows);
}
