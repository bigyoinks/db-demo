'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AllergenBadge from '@/components/AllergenBadge';

interface Restaurant {
  id: number;
  chain_id: number;
  chain_name: string;
  price_range: string;
  chain_avg_rating: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
}

interface HoursRow {
  id: number;
  day: string;
  open_time: string;
  close_time: string;
}

interface MenuItem {
  id: number;
  item_name: string;
  description: string | null;
  price: string;
  allergens: string[];
}

const DAYS = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
const BLANK_HOURS = { day: 'Mon', open_time: '09:00', close_time: '21:00' };
const BLANK_ITEM = { item_name: '', description: '', price: '', allergens: '' };

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function AdminRestaurantPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [hours, setHours] = useState<HoursRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // hours state
  const [addingHours, setAddingHours] = useState(false);
  const [hoursForm, setHoursForm] = useState(BLANK_HOURS);

  // menu state
  const [addingItem, setAddingItem] = useState(false);
  const [itemForm, setItemForm] = useState(BLANK_ITEM);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editItemForm, setEditItemForm] = useState(BLANK_ITEM);

  async function load() {
    const res = await fetch(`/api/restaurants/${restaurantId}`);
    const data = await res.json();
    setRestaurant(data.restaurant);
    setHours(data.hours);
    setMenuItems(data.menuItems);
    setLoading(false);
  }

  useEffect(() => { load(); }, [restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddHours(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    await fetch('/api/hours', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant_id: parseInt(restaurantId), ...hoursForm }),
    });
    setHoursForm(BLANK_HOURS);
    setAddingHours(false);
    load();
  }

  async function handleDeleteHours(id: number) {
    await fetch(`/api/hours/${id}`, { method: 'DELETE' });
    load();
  }

  async function handleAddItem(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const allergens = itemForm.allergens.split(',').map(s => s.trim()).filter(Boolean);
    await fetch('/api/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: parseInt(restaurantId),
        item_name: itemForm.item_name,
        description: itemForm.description || null,
        price: itemForm.price,
        allergens,
      }),
    });
    setItemForm(BLANK_ITEM);
    setAddingItem(false);
    load();
  }

  async function handleSaveItem(id: number) {
    const allergens = editItemForm.allergens.split(',').map(s => s.trim()).filter(Boolean);
    await fetch(`/api/menu-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_name: editItemForm.item_name,
        description: editItemForm.description || null,
        price: editItemForm.price,
        allergens,
      }),
    });
    setEditingItem(null);
    load();
  }

  async function handleDeleteItem(id: number) {
    if (!confirm('Delete this menu item?')) return;
    await fetch(`/api/menu-items/${id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <div className="text-gray-400 py-8 text-center">Loading…</div>;
  if (!restaurant) return <div className="text-gray-400 py-8 text-center">Not found</div>;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500">
        <Link href="/admin" className="hover:text-blue-600">Chains</Link>
        <span className="mx-2">›</span>
        <Link href={`/admin/chains/${restaurant.chain_id}`} className="hover:text-blue-600">{restaurant.chain_name}</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">{restaurant.city}, {restaurant.state}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{restaurant.chain_name}</h1>
        <p className="text-gray-500">
          {restaurant.line1}{restaurant.line2 ? `, ${restaurant.line2}` : ''} · {restaurant.city}, {restaurant.state}
        </p>
      </div>

      {/* Hours */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Hours of Operation</h2>
          <button
            onClick={() => setAddingHours(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + Add Hours
          </button>
        </div>

        {addingHours && (
          <form onSubmit={handleAddHours} className="bg-white rounded-xl border border-blue-200 p-5 mb-4 shadow-sm">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Day</label>
                <select value={hoursForm.day} onChange={e => setHoursForm(f => ({ ...f, day: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Open</label>
                <input type="time" value={hoursForm.open_time} onChange={e => setHoursForm(f => ({ ...f, open_time: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Close</label>
                <input type="time" value={hoursForm.close_time} onChange={e => setHoursForm(f => ({ ...f, close_time: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                Save
              </button>
              <button type="button" onClick={() => setAddingHours(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {hours.length === 0 ? (
          <p className="text-gray-400 text-sm">No hours set.</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Day</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Open</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Close</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {hours.map(h => (
                  <tr key={h.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{h.day}</td>
                    <td className="px-4 py-3 text-gray-600">{formatTime(h.open_time)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatTime(h.close_time)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteHours(h.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Menu items */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Menu <span className="text-gray-400 font-normal text-base">({menuItems.length} items)</span>
          </h2>
          <button
            onClick={() => setAddingItem(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + Add Item
          </button>
        </div>

        {addingItem && (
          <form onSubmit={handleAddItem} className="bg-white rounded-xl border border-blue-200 p-5 mb-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <input required autoFocus placeholder="Item name" value={itemForm.item_name}
                onChange={e => setItemForm(f => ({ ...f, item_name: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input required placeholder="Price (e.g. 9.99)" value={itemForm.price}
                onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Description" value={itemForm.description}
                onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Allergens (comma-separated)" value={itemForm.allergens}
                onChange={e => setItemForm(f => ({ ...f, allergens: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Save</button>
              <button type="button" onClick={() => setAddingItem(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {editingItem === item.id ? (
                <div className="p-4 space-y-2">
                  <input autoFocus value={editItemForm.item_name}
                    onChange={e => setEditItemForm(f => ({ ...f, item_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={editItemForm.price}
                    onChange={e => setEditItemForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="Price"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={editItemForm.description}
                    onChange={e => setEditItemForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={editItemForm.allergens}
                    onChange={e => setEditItemForm(f => ({ ...f, allergens: e.target.value }))}
                    placeholder="Allergens (comma-separated)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleSaveItem(item.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">Save</button>
                    <button onClick={() => setEditingItem(null)} className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{item.item_name}</h3>
                      <span className="text-sm font-bold text-gray-700 shrink-0">{item.price}</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">{item.description}</p>
                    )}
                    {item.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.map(a => <AllergenBadge key={a} name={a} />)}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2 flex gap-3 bg-gray-50">
                    <button
                      onClick={() => {
                        setEditingItem(item.id);
                        setEditItemForm({ item_name: item.item_name, description: item.description ?? '', price: item.price.replace(/[$,]/g, ''), allergens: item.allergens.join(', ') });
                      }}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-400 hover:text-red-600">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
