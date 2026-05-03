import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const { rows } = await pool.query(`
    SELECT r.id, r.chain_id, rc.name AS chain_name,
           l.line1, l.line2, l.city, l.state
    FROM restaurant r
    JOIN restaurant_chain rc ON rc.id = r.chain_id
    JOIN location l ON l.id = r.location_id
    ORDER BY rc.name, l.state, l.city
  `);
  return NextResponse.json(rows);
}
