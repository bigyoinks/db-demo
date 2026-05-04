import Link from 'next/link';
import pool from '@/lib/db';
import StarRating from '@/components/StarRating';

interface SearchParams {
  cuisine?: string;
  price_range?: string | string[];
  min_rating?: string;
  open_now?: string;
}

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

async function getFilterOptions() {
  const { rows } = await pool.query(`SELECT DISTINCT cuisine FROM restaurant_chain WHERE cuisine IS NOT NULL ORDER BY cuisine`);
  return rows.map(r => r.cuisine as string);
}

async function getRestaurants(sp: SearchParams) {
  const cuisine = sp.cuisine || null;
  const priceRanges = Array.isArray(sp.price_range)
    ? sp.price_range
    : sp.price_range
    ? [sp.price_range]
    : [];
  const minRating = parseFloat(sp.min_rating || '0');
  const openNow = sp.open_now === 'true';

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
    conditions.push(`(rc.avg_rating IS NOT NULL AND rc.avg_rating >= $${i++})`);
    values.push(minRating);
  }
  if (openNow) {
    conditions.push(`EXISTS (
      SELECT 1 FROM hours_of_operation h
      WHERE h.restaurant_id = r.id
        AND h.day::text = TO_CHAR(NOW(), 'Dy')
        AND h.open_time <= NOW()::time
        AND h.close_time >= NOW()::time
    )`);
  }

  const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT rc.id, rc.name, rc.cuisine, rc.price_range::text,
            ROUND(rc.avg_rating::numeric, 2) AS avg_rating,
            COUNT(DISTINCT r.id) AS location_count
     FROM restaurant_chain rc
     JOIN restaurant r ON r.chain_id = rc.id
     JOIN location l ON l.id = r.location_id
     WHERE TRUE ${where}
     GROUP BY rc.id, rc.name, rc.cuisine, rc.price_range, rc.avg_rating
     ORDER BY rc.avg_rating DESC NULLS LAST`,
    values
  );
  return rows;
}

const priceColor: Record<string, string> = {
  '$': 'text-green-600 bg-green-50',
  '$$': 'text-yellow-600 bg-yellow-50',
  '$$$': 'text-orange-600 bg-orange-50',
  '$$$$': 'text-red-600 bg-red-50',
};

export default async function CustomerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const [cuisines, restaurants] = await Promise.all([
    getFilterOptions(),
    getRestaurants(sp),
  ]);

  const selectedPrices = Array.isArray(sp.price_range)
    ? sp.price_range
    : sp.price_range
    ? [sp.price_range]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find a Restaurant</h1>
        <p className="text-gray-500 text-sm mt-1">
          {restaurants.length} chain{restaurants.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <form key={JSON.stringify(sp)} method="GET" className="bg-white rounded-xl border border-gray-200 p-5 mb-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Cuisine */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Cuisine
            </label>
            <select
              name="cuisine"
              defaultValue={sp.cuisine || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All cuisines</option>
              {cuisines.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Min Rating */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Min Rating
            </label>
            <select
              name="min_rating"
              defaultValue={sp.min_rating || ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any rating</option>
              <option value="3">3+ ★</option>
              <option value="4">4+ ★</option>
              <option value="4.5">4.5+ ★</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Price Range
            </label>
            <div className="flex gap-1 flex-wrap">
              {PRICE_RANGES.map(p => (
                <label key={p} className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    name="price_range"
                    value={p}
                    defaultChecked={selectedPrices.includes(p)}
                    className="rounded"
                  />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${priceColor[p] ?? ''}`}>{p}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Open Now */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="open_now"
                value="true"
                defaultChecked={sp.open_now === 'true'}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Open now</span>
            </label>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          <Link
            href="/customer"
            className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        </div>
      </form>

      {restaurants.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-lg font-medium">No restaurants match your filters</p>
          <p className="text-sm mt-1">Try relaxing your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map(r => (
            <Link
              key={r.id}
              href={`/customer/chains/${r.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {r.name}
                </h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${priceColor[r.price_range] ?? 'bg-gray-100 text-gray-600'}`}>
                  {r.price_range}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{r.cuisine}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <StarRating value={parseFloat(r.avg_rating) || 0} size="sm" />
                  <span className="text-sm font-semibold text-gray-700">
                    {r.avg_rating ? parseFloat(r.avg_rating).toFixed(2) : '—'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {r.location_count} location{r.location_count !== '1' ? 's' : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
