import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ chainId: string }> }) {
  const { chainId } = await params;
  const chain = await pool.query(
    `SELECT id, name, cuisine, price_range, ROUND(avg_rating::numeric, 2) AS avg_rating
     FROM restaurant_chain WHERE id = $1`,
    [chainId]
  );
  if (!chain.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const restaurants = await pool.query(
    `SELECT r.id, l.line1, l.line2, l.city, l.state,
            COUNT(rv.id) AS review_count,
            ROUND(AVG(rv.rating)::numeric, 2) AS local_avg_rating
     FROM restaurant r
     JOIN location l ON l.id = r.location_id
     LEFT JOIN review rv ON rv.rid = r.id
     WHERE r.chain_id = $1
     GROUP BY r.id, l.line1, l.line2, l.city, l.state
     ORDER BY l.state, l.city`,
    [chainId]
  );
  return NextResponse.json({ chain: chain.rows[0], restaurants: restaurants.rows });
}

export async function PUT(req: Request, { params }: { params: Promise<{ chainId: string }> }) {
  const { chainId } = await params;
  const { name, cuisine, price_range } = await req.json();
  const { rows } = await pool.query(
    `UPDATE restaurant_chain SET name=$1, cuisine=$2, price_range=$3 WHERE id=$4 RETURNING *`,
    [name, cuisine, price_range, chainId]
  );
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ chainId: string }> }) {
  const { chainId } = await params;
  await pool.query(`DELETE FROM restaurant_chain WHERE id = $1`, [chainId]);
  return NextResponse.json({ ok: true });
}
