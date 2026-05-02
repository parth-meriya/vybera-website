import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2 } from 'lucide-react';
import { getAllReviews, deleteReview } from '../../firebase/reviews';
import toast from 'react-hot-toast';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const data = await getAllReviews();
    setReviews(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted.', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to delete.', { className: 'toast-vybera' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="spinner border-vy-grey border-t-vy-white" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h1 className="text-xl font-bold tracking-wider text-vy-white mb-2">Product Reviews</h1>
        <p className="text-xs text-vy-grey tracking-widest uppercase">Monitor and moderate customer reviews</p>
      </div>

      <div className="bg-vy-card border border-vy-border overflow-x-auto">
        <table className="w-full text-left text-sm text-vy-light">
          <thead className="bg-vy-dark border-b border-vy-border text-xs uppercase tracking-widest text-vy-grey">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Product ID</th>
              <th className="px-6 py-4 font-semibold">Rating</th>
              <th className="px-6 py-4 font-semibold w-1/3">Review</th>
              <th className="px-6 py-4 font-semibold">Images</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vy-border">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-vy-grey text-xs tracking-widest uppercase">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map(review => (
                <tr key={review.id} className="hover:bg-vy-border/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-vy-white">{review.userName}</p>
                    <p className="text-[10px] text-vy-grey uppercase">{review.createdAt?.toDate?.().toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-vy-grey bg-vy-dark px-2 border border-vy-border">...{review.productId.slice(-6)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-yellow-400">
                      <span>{review.rating}</span>
                      <Star size={12} className="fill-current" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="line-clamp-2 text-xs leading-relaxed" title={review.reviewText}>
                      {review.reviewText}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {review.imageUrls?.length > 0 ? (
                      <div className="flex -space-x-2 relative z-0">
                        {review.imageUrls.map((url, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-vy-card bg-vy-dark overflow-hidden flex-shrink-0 cursor-zoom-in" onClick={() => window.open(url, '_blank')}>
                            <img src={url} alt="review snap" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-vy-grey text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-vy-grey hover:text-red-400 transition-colors bg-vy-dark p-2 border border-vy-border hover:border-red-500/30"
                      title="Delete Review"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default AdminReviews;
