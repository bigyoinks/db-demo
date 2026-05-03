'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StarRating from '@/components/StarRating';

interface Chain {
  id: number;
  name: string;
  cuisine: string;
  price_range: string;
  avg_rating: string | null;
  location_count: string;
}

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];
const BLANK = { name: '', cuisine: '', price_range: '$' };

const priceColor: Record<string, string> = {
  '$': 'text-green-700 bg-green-50 border-green-200',
  '$$': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  '$$$': 'text-orange-700 bg-orange-50 border-orange-200',
  '$$$$': 'text-red-700 bg-red-50 border-red-200',
};

export default function AdminPage() {
  const [chains, setChains] = useState<Chain[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(BLANK);

  async function load() {
    const res = await fetch('/api/admin/chains');
    setChains(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch('/api/chains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm(BLANK);
    setAdding(false);
    load();
  }

  async function handleSave(id: number) {
    await fetch(`/api/chains/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setEditing(null);
    load();
  }


  if (loading) return <div className="text-gray-400 py-8 text-center">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Chains</h1>
          <p className="text-gray-500 text-sm mt-0.5">{chains.length} chains</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Add Chain
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-blue-200 p-5 mb-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-3">New Chain</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input
              required autoFocus placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Cuisine"
              value={form.cuisine}
              onChange={e => setForm(f => ({ ...f, cuisine: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={form.price_range}
              onChange={e => setForm(f => ({ ...f, price_range: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
              Save
            </button>
            <button type="button" onClick={() => setAdding(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chains.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {editing === c.id ? (
              <div className="p-5 space-y-3">
                <input
                  autoFocus
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Cuisine"
                    value={editForm.cuisine}
                    onChange={e => setEditForm(f => ({ ...f, cuisine: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={editForm.price_range}
                    onChange={e => setEditForm(f => ({ ...f, price_range: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSave(c.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    Save
                  </button>
                  <button onClick={() => setEditing(null)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href={`/admin/chains/${c.id}`} className="block p-5 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {c.name}
                    </h2>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ml-2 shrink-0 ${priceColor[c.price_range] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.price_range}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{c.cuisine || '—'}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <StarRating value={parseFloat(c.avg_rating ?? '0')} size="sm" />
                      <span className="text-sm font-semibold text-gray-700">
                        {c.avg_rating ? parseFloat(c.avg_rating).toFixed(2) : '—'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {c.location_count} location{c.location_count !== '1' ? 's' : ''}
                    </span>
                  </div>
                </Link>
                <div className="border-t border-gray-100 px-5 py-2.5 flex gap-4 bg-gray-50">
                  <button
                    onClick={() => { setEditing(c.id); setEditForm({ name: c.name, cuisine: c.cuisine, price_range: c.price_range }); }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Edit
                  </button>
                  <Link href={`/admin/chains/${c.id}`} className="text-xs text-gray-500 hover:text-gray-700 ml-auto">
                    Manage locations →
                  </Link>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
