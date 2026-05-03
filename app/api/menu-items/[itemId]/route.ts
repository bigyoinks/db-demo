import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const { item_name, description, price, allergens } = await req.json();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE menu_item SET item_name=$1, description=$2, price=$3::money WHERE id=$4`,
      [item_name, description || null, price, itemId]
    );
    await client.query(`DELETE FROM allergens WHERE item_id=$1`, [itemId]);
    if (allergens?.length) {
      for (const name of allergens) {
        await client.query(
          `INSERT INTO allergens (item_id, allergen_name) VALUES ($1, $2)`,
          [itemId, name]
        );
      }
    }
    await client.query('COMMIT');
    return NextResponse.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  await pool.query(`DELETE FROM menu_item WHERE id=$1`, [itemId]);
  return NextResponse.json({ ok: true });
}
