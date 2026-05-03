import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const { rows } = await pool.query(
    `SELECT DISTINCT allergen_name FROM allergens WHERE allergen_name IS NOT NULL AND allergen_name <> 'None' ORDER BY allergen_name`
  );
  return NextResponse.json(rows.map(r => r.allergen_name));
}
