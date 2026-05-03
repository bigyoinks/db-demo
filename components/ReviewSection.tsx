'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import RatingUpdatedBanner from './TriggerBanner';
import AllergenBadge from './AllergenBadge';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  username: string;
}

interface Customer {
  id: number;
  username: string;
}

interface RatingUpdate {
  chainName: string;
  before: number;
  after: number;
}

interface Props {
  restaurantId: number;
  chainName: string;
  initialChainAvg: number;
  initialReviews: Review[];
  customers: Customer[];
}

export default function ReviewSection({
  restaurantId,
  chainName,
  initialChainAvg,
  initialReviews,
  customers,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [chainAvg, setChainAvg] = useState(initialChainAvg);
  const [ratingUpdate, setRatingUpdate] = useState<RatingUpdate | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? 0);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurantId, rating, comment, customer_id: customerId }),
      });
      const data = await res.json();
      const customer = customers.find(c => c.id === customerId);
      setReviews(prev => [
        { id: data.review.id, rating, comment: comment || null, username: customer?.username ?? 'Unknown' },
        ...prev,
      ]);
      setChainAvg(data.chainAvgAfter);
      setRatingUpdate({ chainName, before: data.chainAvgBefore, after: data.chainAvgAfter });
      setComment('');
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId: number) {
    const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
    const data = await res.json();
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    setChainAvg(data.chainAvgAfter);
    setRatingUpdate({ chainName, before: data.chainAvgBefore, after: data.chainAvgAfter });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-6 items-start">
      {/* Write a review — left column */}
      <div className="lg:sticky lg:top-6">
        {ratingUpdate && (
          <div className="mb-4">
            <RatingUpdatedBanner
              chainName={ratingUpdate.chainName}
              before={ratingUpdate.before}
              after={ratingUpdate.after}
              onClose={() => setRatingUpdate(null)}
            />
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <StarRating value={chainAvg} size="md" />
            <span className="text-lg font-bold text-gray-800">{chainAvg.toFixed(2)}</span>
          </div>

          <h3 className="font-semibold text-gray-800 mb-4">Write a Review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Reviewing as
              </label>
              <select
                value={customerId}
                onChange={e => setCustomerId(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Rating
              </label>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                Review
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
                maxLength={255}
                placeholder="Share your experience..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      {/* Reviews list — right column */}
      <div className="min-w-0">
        <p className="text-sm text-gray-500 mb-3">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
        {reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5 flex gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-gray-900">{r.username}</span>
                    <StarRating value={r.rating} size="sm" />
                    <span className="text-sm text-gray-400">{r.rating}/5</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-400 hover:text-red-600 self-start transition-colors shrink-0"
                  title="Delete review"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { AllergenBadge };
