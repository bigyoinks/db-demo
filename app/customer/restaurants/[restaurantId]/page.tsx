import Link from 'next/link';
import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import StarRating from '@/components/StarRating';
import AllergenBadge from '@/components/AllergenBadge';
import ReviewSection from '@/components/ReviewSection';

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const priceColor: Record<string, string> = {
  '$': 'text-green-600 bg-green-50 border-green-200',
  '$$': 'text-yellow-600 bg-yellow-50 border-yellow-200',
  '$$$': 'text-orange-600 bg-orange-50 border-orange-200',
  '$$$$': 'text-red-600 bg-red-50 border-red-200',
};

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;

  const [restResult, menuResult, hoursResult, reviewsResult, customersResult] = await Promise.all([
    pool.query(
      `SELECT r.id, rc.id AS chain_id, rc.name AS chain_name, rc.price_range::text,
              ROUND(rc.avg_rating::numeric, 2) AS chain_avg_rating,
              l.line1, l.line2, l.city, l.state
       FROM restaurant r
       JOIN restaurant_chain rc ON rc.id = r.chain_id
       JOIN location l ON l.id = r.location_id
       WHERE r.id = $1`,
      [restaurantId]
    ),
    pool.query(
      `SELECT mi.id, mi.item_name, mi.description, mi.price::money::text AS price,
              ARRAY_AGG(a.allergen_name ORDER BY a.allergen_name)
                FILTER (WHERE a.allergen_name IS NOT NULL AND a.allergen_name <> 'None') AS allergens
       FROM menu_item mi
       LEFT JOIN allergens a ON a.item_id = mi.id
       WHERE mi.restaurant_id = $1
       GROUP BY mi.id ORDER BY mi.item_name`,
      [restaurantId]
    ),
    pool.query(
      `SELECT id, day, open_time::text AS open_time, close_time::text AS close_time
       FROM hours_of_operation
       WHERE restaurant_id = $1
       ORDER BY CASE day
         WHEN 'Sun' THEN 0 WHEN 'Mon' THEN 1 WHEN 'Tues' THEN 2
         WHEN 'Wed' THEN 3 WHEN 'Thurs' THEN 4 WHEN 'Fri' THEN 5 WHEN 'Sat' THEN 6 END`,
      [restaurantId]
    ),
    pool.query(
      `SELECT rv.id, rv.rating, rv.comment, c.username
       FROM review rv JOIN customer c ON c.id = rv.uid
       WHERE rv.rid = $1 ORDER BY rv.id DESC`,
      [restaurantId]
    ),
    pool.query(`SELECT id, username FROM customer ORDER BY username`),
  ]);

  if (!restResult.rows[0]) notFound();

  const rest = restResult.rows[0];
  const menuItems = menuResult.rows.map(r => ({ ...r, allergens: r.allergens ?? [] }));
  const hours = hoursResult.rows;
  const reviews = reviewsResult.rows;
  const customers = customersResult.rows;
  const chainAvg = parseFloat(rest.chain_avg_rating) || 0;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/customer" className="hover:text-blue-600">Explore</Link>
        <span className="mx-2">›</span>
        <Link href={`/customer/chains/${rest.chain_id}`} className="hover:text-blue-600">
          {rest.chain_name}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">{rest.city}, {rest.state}</span>
      </nav>

      {/* Header: info + hours side by side */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{rest.chain_name}</h1>
            <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${priceColor[rest.price_range] ?? 'bg-gray-100 text-gray-600'}`}>
              {rest.price_range}
            </span>
          </div>
          <p className="text-gray-500 mb-3">
            {rest.line1}{rest.line2 ? `, ${rest.line2}` : ''} · {rest.city}, {rest.state}
          </p>
          <div className="flex items-center gap-2">
            <StarRating value={chainAvg} size="md" />
            <span className="font-semibold text-gray-800">{chainAvg.toFixed(2)}</span>
            <span className="text-sm text-gray-400">chain average</span>
          </div>
        </div>

        {hours.length > 0 && (
          <div className="sm:w-56 shrink-0">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Hours</h2>
            <div className="space-y-1">
              {hours.map(h => (
                <div key={h.id} className="flex justify-between text-sm">
                  <span className="text-gray-500 w-12">{h.day}</span>
                  <span className="text-gray-800">{formatTime(h.open_time)} – {formatTime(h.close_time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Menu — full width, 4-column grid */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Menu <span className="text-gray-400 font-normal text-base">({menuItems.length} items)</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-gray-900 leading-snug">{item.item_name}</h3>
                <span className="text-sm font-bold text-gray-700 shrink-0">{item.price}</span>
              </div>
              {item.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              )}
              {item.allergens.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto pt-1">
                  {item.allergens.map((a: string) => (
                    <AllergenBadge key={a} name={a} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Reviews — full width, form + list side by side */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h2>
        <ReviewSection
          restaurantId={parseInt(restaurantId)}
          chainName={rest.chain_name}
          initialChainAvg={chainAvg}
          initialReviews={reviews}
          customers={customers}
        />
      </section>
    </div>
  );
}
