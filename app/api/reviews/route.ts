import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  const { restaurant_id, rating, comment, customer_id } = await req.json();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const before = await client.query(
      `SELECT ROUND(rc.avg_rating::numeric, 2) AS avg_rating
       FROM restaurant r JOIN restaurant_chain rc ON rc.id = r.chain_id
       WHERE r.id = $1`,
      [restaurant_id]
    );

    const inserted = await client.query(
      `INSERT INTO review (rating, comment, uid, rid) VALUES ($1, $2, $3, $4)
       RETURNING id, rating, comment, uid, rid`,
      [rating, comment || null, customer_id, restaurant_id]
    );

    const after = await client.query(
      `SELECT ROUND(rc.avg_rating::numeric, 2) AS avg_rating
       FROM restaurant r JOIN restaurant_chain rc ON rc.id = r.chain_id
       WHERE r.id = $1`,
      [restaurant_id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      review: inserted.rows[0],
      chainAvgBefore: parseFloat(before.rows[0]?.avg_rating ?? '0'),
      chainAvgAfter: parseFloat(after.rows[0]?.avg_rating ?? '0'),
    }, { status: 201 });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
