'use client';

import { useState, useMemo } from 'react';
import AllergenBadge from './AllergenBadge';

interface MenuItem {
  id: number;
  item_name: string;
  description: string | null;
  price: string;
  allergens: string[];
}

export default function MenuSection({ items }: { items: MenuItem[] }) {
  const [excluded, setExcluded] = useState<string[]>([]);

  const allergens = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const a of item.allergens) set.add(a);
    }
    return [...set].sort();
  }, [items]);

  const visible = excluded.length
    ? items.filter(item => !item.allergens.some(a => excluded.includes(a)))
    : items;

  function toggle(a: string) {
    setExcluded(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Menu <span className="text-gray-400 font-normal text-base">({visible.length} items)</span>
      </h2>

      {allergens.length === 0 ? (
        <p className="mb-4 text-sm text-gray-500">No Allergens</p>
      ) : (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Exclude allergens:</span>
          {allergens.map(a => (
            <label key={a} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={excluded.includes(a)}
                onChange={() => toggle(a)}
                className="rounded"
              />
              <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
                {a}
              </span>
            </label>
          ))}
          {excluded.length > 0 && (
            <button
              onClick={() => setExcluded([])}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visible.map(item => (
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
  );
}
