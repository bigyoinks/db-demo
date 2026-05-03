import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import StarRating from '@/components/StarRating';

const priceColor: Record<string, string> = {
  '$': 'text-green-600 bg-green-50 border-green-200',
  '$$': 'text-yellow-600 bg-yellow-50 border-yellow-200',
  '$$$': 'text-orange-600 bg-orange-50 border-orange-200',
  '$$$$': 'text-red-600 bg-red-50 border-red-200',
};

export default async function ChainPage({ params }: { params: Promise<{ chainId: string }> }) {
  const { chainId } = await params;

  const [chainResult, restResult] = await Promise.all([
    pool.query(
      `SELECT id, name, cuisine, price_range::text, ROUND(avg_rating::numeric, 2) AS avg_rating
       FROM restaurant_chain WHERE id = $1`,
      [chainId]
    ),
    pool.query(
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
    ),
  ]);

  if (!chainResult.rows[0]) notFound();

  const chain = chainResult.rows[0];
  const restaurants = restResult.rows;

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/customer" className="hover:text-blue-600">Find a Restaurant</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">{chain.name}</span>
      </nav>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{chain.name}</h1>
            <p className="text-gray-500 mt-1">{chain.cuisine}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-bold px-3 py-1 rounded-full border ${priceColor[chain.price_range] ?? 'bg-gray-100 text-gray-600'}`}>
              {chain.price_range}
            </span>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <StarRating value={parseFloat(chain.avg_rating) || 0} size="md" />
                <span className="text-xl font-bold text-gray-800">
                  {chain.avg_rating ? parseFloat(chain.avg_rating).toFixed(2) : '—'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">chain avg rating</p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {restaurants.length} Location{restaurants.length !== 1 ? 's' : ''}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.map(r => (
          <Link
            key={r.id}
            href={`/customer/restaurants/${r.id}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group"
          >
            <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {r.line1}{r.line2 ? `, ${r.line2}` : ''}
            </p>
            <p className="text-sm text-gray-500 mb-3">{r.city}, {r.state}</p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <StarRating value={parseFloat(r.local_avg_rating) || 0} size="sm" />
                <span className="text-gray-600 font-medium">
                  {r.local_avg_rating ? parseFloat(r.local_avg_rating).toFixed(1) : '—'}
                </span>
              </div>
              <span className="text-gray-400">
                {r.review_count} review{r.review_count !== '1' ? 's' : ''}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
