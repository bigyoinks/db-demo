import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const chainResult = await client.query(
      `SELECT rc.id AS chain_id, ROUND(rc.avg_rating::numeric, 2) AS avg_rating
       FROM review rv
       JOIN restaurant r ON r.id = rv.rid
       JOIN restaurant_chain rc ON rc.id = r.chain_id
       WHERE rv.id = $1`,
      [reviewId]
    );
    if (!chainResult.rows[0]) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const { chain_id, avg_rating: before } = chainResult.rows[0];

    await client.query(`DELETE FROM review WHERE id=$1`, [reviewId]);

    const afterResult = await client.query(
      `SELECT ROUND(avg_rating::numeric, 2) AS avg_rating FROM restaurant_chain WHERE id=$1`,
      [chain_id]
    );

    await client.query('COMMIT');

    return NextResponse.json({
      chainAvgBefore: parseFloat(before),
      chainAvgAfter: parseFloat(afterResult.rows[0]?.avg_rating ?? '0'),
    });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
