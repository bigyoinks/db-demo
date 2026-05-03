import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const restaurantId = searchParams.get('restaurant_id');
  const { rows } = await pool.query(
    `SELECT mi.id, mi.item_name, mi.description, mi.price::money::text AS price,
            mi.restaurant_id,
            ARRAY_AGG(a.allergen_name ORDER BY a.allergen_name)
              FILTER (WHERE a.allergen_name IS NOT NULL AND a.allergen_name <> 'None') AS allergens
     FROM menu_item mi
     LEFT JOIN allergens a ON a.item_id = mi.id
     WHERE ($1::int IS NULL OR mi.restaurant_id = $1)
     GROUP BY mi.id ORDER BY mi.item_name`,
    [restaurantId ? parseInt(restaurantId) : null]
  );
  return NextResponse.json(rows.map(r => ({ ...r, allergens: r.allergens ?? [] })));
}

export async function POST(req: Request) {
  const { restaurant_id, item_name, description, price, allergens } = await req.json();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const item = await client.query(
      `INSERT INTO menu_item (restaurant_id, item_name, description, price)
       VALUES ($1, $2, $3, $4::money) RETURNING id`,
      [restaurant_id, item_name, description || null, price]
    );
    const itemId = item.rows[0].id;
    if (allergens?.length) {
      for (const name of allergens) {
        await client.query(
          `INSERT INTO allergens (item_id, allergen_name) VALUES ($1, $2)`,
          [itemId, name]
        );
      }
    }
    await client.query('COMMIT');
    return NextResponse.json({ id: itemId }, { status: 201 });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
