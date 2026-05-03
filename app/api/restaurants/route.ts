import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cuisine = searchParams.get('cuisine');
  const priceRanges = searchParams.getAll('price_range');
  const minRating = parseFloat(searchParams.get('min_rating') || '0');
  const excludeAllergens = searchParams.getAll('exclude_allergen');
  const openNow = searchParams.get('open_now') === 'true';

  const conditions: string[] = [];
  const values: (string | number | string[])[] = [];
  let i = 1;

  if (cuisine) {
    conditions.push(`rc.cuisine = $${i++}`);
    values.push(cuisine);
  }
  if (priceRanges.length) {
    conditions.push(`rc.price_range = ANY($${i++}::price_range[])`);
    values.push(priceRanges);
  }
  if (minRating > 0) {
    conditions.push(`rc.avg_rating >= $${i++}`);
    values.push(minRating);
  }
  if (excludeAllergens.length) {
    conditions.push(`mi.id NOT IN (
      SELECT item_id FROM allergens WHERE allergen_name = ANY($${i++}::text[])
    )`);
    values.push(excludeAllergens);
  }
  if (openNow) {
    conditions.push(`EXISTS (
      SELECT 1 FROM hours_of_operation h
      WHERE h.restaurant_id = r.id
        AND h.day::text = TO_CHAR(NOW() AT TIME ZONE 'America/Chicago', 'Dy')
        AND h.open_time <= (NOW() AT TIME ZONE 'America/Chicago')::time
        AND h.close_time >= (NOW() AT TIME ZONE 'America/Chicago')::time
    )`);
  }

  const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT rc.id, rc.name, rc.cuisine, rc.price_range,
            ROUND(rc.avg_rating::numeric, 2) AS avg_rating,
            COUNT(DISTINCT r.id) AS location_count
     FROM restaurant_chain rc
     JOIN restaurant r ON r.chain_id = rc.id
     JOIN location l ON l.id = r.location_id
     JOIN menu_item mi ON mi.restaurant_id = r.id
     WHERE TRUE ${where}
     GROUP BY rc.id, rc.name, rc.cuisine, rc.price_range, rc.avg_rating
     ORDER BY rc.avg_rating DESC NULLS LAST`,
    values
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { chain_id, line1, line2, city, state } = await req.json();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const loc = await client.query(
      `INSERT INTO location (line1, line2, city, state) VALUES ($1, $2, $3, $4) RETURNING id`,
      [line1, line2 || null, city, state]
    );
    const rest = await client.query(
      `INSERT INTO restaurant (chain_id, location_id) VALUES ($1, $2) RETURNING id`,
      [chain_id, loc.rows[0].id]
    );
    await client.query('COMMIT');
    return NextResponse.json({ id: rest.rows[0].id, location_id: loc.rows[0].id }, { status: 201 });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
