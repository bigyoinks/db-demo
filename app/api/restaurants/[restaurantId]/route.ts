import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const id = restaurantId;

  const [restResult, menuResult, hoursResult, reviewsResult] = await Promise.all([
    pool.query(
      `SELECT r.id, rc.id AS chain_id, rc.name AS chain_name, rc.price_range,
              ROUND(rc.avg_rating::numeric, 2) AS chain_avg_rating,
              l.line1, l.line2, l.city, l.state
       FROM restaurant r
       JOIN restaurant_chain rc ON rc.id = r.chain_id
       JOIN location l ON l.id = r.location_id
       WHERE r.id = $1`,
      [id]
    ),
    pool.query(
      `SELECT mi.id, mi.item_name, mi.description, mi.price::money::text AS price,
              ARRAY_AGG(a.allergen_name ORDER BY a.allergen_name)
                FILTER (WHERE a.allergen_name IS NOT NULL AND a.allergen_name <> 'None') AS allergens
       FROM menu_item mi
       LEFT JOIN allergens a ON a.item_id = mi.id
       WHERE mi.restaurant_id = $1
       GROUP BY mi.id ORDER BY mi.item_name`,
      [id]
    ),
    pool.query(
      `SELECT id, day, open_time::text AS open_time, close_time::text AS close_time
       FROM hours_of_operation
       WHERE restaurant_id = $1
       ORDER BY CASE day
         WHEN 'Sun' THEN 0 WHEN 'Mon' THEN 1 WHEN 'Tues' THEN 2
         WHEN 'Wed' THEN 3 WHEN 'Thurs' THEN 4 WHEN 'Fri' THEN 5 WHEN 'Sat' THEN 6
       END`,
      [id]
    ),
    pool.query(
      `SELECT rv.id, rv.rating, rv.comment, c.username
       FROM review rv JOIN customer c ON c.id = rv.uid
       WHERE rv.rid = $1 ORDER BY rv.id DESC`,
      [id]
    ),
  ]);

  if (!restResult.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    restaurant: restResult.rows[0],
    menuItems: menuResult.rows.map(r => ({ ...r, allergens: r.allergens ?? [] })),
    hours: hoursResult.rows,
    reviews: reviewsResult.rows,
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const { chain_id, line1, line2, city, state } = await req.json();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const loc = await client.query(
      `SELECT location_id FROM restaurant WHERE id = $1`, [restaurantId]
    );
    await client.query(
      `UPDATE location SET line1=$1, line2=$2, city=$3, state=$4 WHERE id=$5`,
      [line1, line2 || null, city, state, loc.rows[0].location_id]
    );
    await client.query(`UPDATE restaurant SET chain_id=$1 WHERE id=$2`, [chain_id, restaurantId]);
    await client.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  const loc = await pool.query(`SELECT location_id FROM restaurant WHERE id=$1`, [restaurantId]);
  await pool.query(`DELETE FROM restaurant WHERE id=$1`, [restaurantId]);
  if (loc.rows[0]) {
    await pool.query(`DELETE FROM location WHERE id=$1`, [loc.rows[0].location_id]);
  }
  return NextResponse.json({ ok: true });
}
