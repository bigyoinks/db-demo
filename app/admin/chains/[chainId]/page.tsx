'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import StarRating from '@/components/StarRating';

interface Chain {
  id: number;
  name: string;
  cuisine: string;
  price_range: string;
  avg_rating: string | null;
}

interface Location {
  id: number;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  review_count: string;
  local_avg_rating: string | null;
}

const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];
const BLANK_LOC = { line1: '', line2: '', city: '', state: '' };

export default function AdminChainPage() {
  const { chainId } = useParams<{ chainId: string }>();
  const [chain, setChain] = useState<Chain | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChain, setEditingChain] = useState(false);
  const [chainForm, setChainForm] = useState({ name: '', cuisine: '', price_range: '$' });
  const [addingLoc, setAddingLoc] = useState(false);
  const [locForm, setLocForm] = useState(BLANK_LOC);
  const [editingLoc, setEditingLoc] = useState<number | null>(null);
  const [editLocForm, setEditLocForm] = useState(BLANK_LOC);

  async function load() {
    const res = await fetch(`/api/chains/${chainId}`);
    const data = await res.json();
    setChain(data.chain);
    setLocations(data.restaurants);
    setLoading(false);
  }

  useEffect(() => { load(); }, [chainId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveChain() {
    await fetch(`/api/chains/${chainId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chainForm),
    });
    setEditingChain(false);
    load();
  }

  async function handleAddLocation(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain_id: parseInt(chainId), ...locForm, line2: locForm.line2 || null }),
    });
    setLocForm(BLANK_LOC);
    setAddingLoc(false);
    load();
  }

  async function handleSaveLocation(id: number) {
    await fetch(`/api/restaurants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain_id: parseInt(chainId), ...editLocForm, line2: editLocForm.line2 || null }),
    });
    setEditingLoc(null);
    load();
  }

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading…</div>;
  if (!chain) return <div className="text-gray-400 py-8 text-center">Not found</div>;

  const avgRating = parseFloat(chain.avg_rating ?? '0');

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-blue-600">Chains</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">{chain.name}</span>
      </nav>

      {/* Chain header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
        {editingChain ? (
          <div className="space-y-3 max-w-lg">
            <input
              autoFocus
              value={chainForm.name}
              onChange={e => setChainForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            />
            <div className="flex gap-2">
              <input
                placeholder="Cuisine"
                value={chainForm.cuisine}
                onChange={e => setChainForm(f => ({ ...f, cuisine: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={chainForm.price_range}
                onChange={e => setChainForm(f => ({ ...f, price_range: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveChain} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                Save
              </button>
              <button onClick={() => setEditingChain(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{chain.name}</h1>
              <p className="text-gray-500 text-sm mb-3">{chain.cuisine || '—'} · {chain.price_range}</p>
              <div className="flex items-center gap-2">
                <StarRating value={avgRating} size="md" />
                <span className="font-semibold text-gray-800">{avgRating > 0 ? avgRating.toFixed(2) : '—'}</span>
                <span className="text-sm text-gray-400">chain average</span>
              </div>
            </div>
            <button
              onClick={() => { setEditingChain(true); setChainForm({ name: chain.name, cuisine: chain.cuisine, price_range: chain.price_range }); }}
              className="text-sm text-blue-600 hover:underline"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Locations */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Locations <span className="text-gray-400 font-normal text-base">({locations.length})</span>
        </h2>
        <button
          onClick={() => setAddingLoc(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Add Location
        </button>
      </div>

      {addingLoc && (
        <form onSubmit={handleAddLocation} className="bg-white rounded-xl border border-blue-200 p-5 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">New Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <input required autoFocus placeholder="Address line 1" value={locForm.line1}
              onChange={e => setLocForm(f => ({ ...f, line1: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input placeholder="Line 2 (optional)" value={locForm.line2}
              onChange={e => setLocForm(f => ({ ...f, line2: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input required placeholder="City" value={locForm.city}
              onChange={e => setLocForm(f => ({ ...f, city: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input required placeholder="State" value={locForm.state}
              onChange={e => setLocForm(f => ({ ...f, state: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Save</button>
            <button type="button" onClick={() => setAddingLoc(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map(loc => (
          <div key={loc.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {editingLoc === loc.id ? (
              <div className="p-5 space-y-3">
                <input autoFocus value={editLocForm.line1}
                  onChange={e => setEditLocForm(f => ({ ...f, line1: e.target.value }))}
                  placeholder="Address line 1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input value={editLocForm.line2 ?? ''}
                  onChange={e => setEditLocForm(f => ({ ...f, line2: e.target.value }))}
                  placeholder="Line 2 (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <input value={editLocForm.city}
                    onChange={e => setEditLocForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="City"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={editLocForm.state}
                    onChange={e => setEditLocForm(f => ({ ...f, state: e.target.value }))}
                    placeholder="State"
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSaveLocation(loc.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Save</button>
                  <button onClick={() => setEditingLoc(null)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <Link href={`/admin/restaurants/${loc.id}`} className="block p-5 hover:bg-gray-50 transition-colors group">
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {loc.line1}{loc.line2 ? `, ${loc.line2}` : ''}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">{loc.city}, {loc.state}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <StarRating value={parseFloat(loc.local_avg_rating ?? '0')} size="sm" />
                      <span className="text-gray-600">{loc.local_avg_rating ? parseFloat(loc.local_avg_rating).toFixed(1) : '—'}</span>
                    </div>
                    <span className="text-gray-400">{loc.review_count} review{loc.review_count !== '1' ? 's' : ''}</span>
                  </div>
                </Link>
                <div className="border-t border-gray-100 px-5 py-2.5 flex gap-4 bg-gray-50">
                  <button
                    onClick={() => { setEditingLoc(loc.id); setEditLocForm({ line1: loc.line1, line2: loc.line2 ?? '', city: loc.city, state: loc.state }); }}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Edit
                  </button>
                  <Link href={`/admin/restaurants/${loc.id}`} className="text-xs text-gray-500 hover:text-gray-700 ml-auto">
                    Manage →
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
