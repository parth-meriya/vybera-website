import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2 } from 'lucide-react';
import { getAllReviews, deleteReview, approveReview, rejectReview } from '../../firebase/reviews';
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

  const handleApprove = async (id) => {
    try {
      await approveReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      toast.success('Review approved.', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to approve review.', { className: 'toast-vybera' });
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectReview(id);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
      toast.success('Review rejected.', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to reject review.', { className: 'toast-vybera' });
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-wider text-[#30231F] mb-1 font-display">Product Reviews</h1>
        <p className="text-xs text-[#75665C] tracking-widest uppercase font-semibold">Monitor and moderate customer reviews</p>
      </div>

      <div className="bg-[#FAF5ED] border border-[#D4BEA5] overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm text-[#30231F]">
          <thead className="bg-[#FAF5ED] border-b border-[#D4BEA5] text-xs uppercase tracking-widest text-[#75665C]">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Product ID</th>
              <th className="px-6 py-4 font-semibold">Rating</th>
              <th className="px-6 py-4 font-semibold w-1/3">Review</th>
              <th className="px-6 py-4 font-semibold">Images</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D4BEA5]">
            {reviews.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-[#75665C] text-xs tracking-widest uppercase">
                  No reviews found
                </td>
              </tr>
            ) : (
              reviews.map(review => (
                <tr key={review.id} className="hover:bg-[#F3E7D8]/60 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#30231F]">{review.userName}</p>
                    <p className="text-[11px] text-[#75665C] uppercase">{review.createdAt?.toDate?.().toLocaleDateString() || 'Just now'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-[#590907] font-bold bg-white px-2 py-0.5 border border-[#D4BEA5]">...{review.productId.slice(-6)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-amber-800 font-bold">
                      <span>{review.rating}</span>
                      <Star size={13} className="fill-current text-amber-500" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="line-clamp-2 text-xs leading-relaxed text-[#30231F]" title={review.reviewText}>
                      {review.reviewText}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {review.imageUrls?.length > 0 ? (
                      <div className="flex -space-x-2 relative z-0">
                        {review.imageUrls.map((url, i) => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-[#FAF5ED] bg-white overflow-hidden flex-shrink-0 cursor-zoom-in" onClick={() => window.open(url, '_blank')}>
                            <img src={url} alt="review snap" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#75665C] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={
                      review.status === 'approved' 
                        ? 'badge-confirmed'
                        : review.status === 'rejected'
                        ? 'badge-cancelled'
                        : 'badge-pending'
                    }>
                      {review.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {review.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          className="px-2.5 py-1 bg-emerald-700 text-white text-[10px] tracking-widest font-bold uppercase hover:bg-emerald-800 transition-colors rounded"
                          title="Approve Review"
                        >
                          Approve
                        </button>
                      )}
                      {review.status !== 'rejected' && (
                        <button
                          onClick={() => handleReject(review.id)}
                          className="px-2.5 py-1 bg-rose-700 text-white text-[10px] tracking-widest font-bold uppercase hover:bg-rose-800 transition-colors rounded"
                          title="Reject Review"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-[#75665C] hover:text-rose-700 transition-colors bg-white p-2 border border-[#D4BEA5] hover:border-rose-400"
                        title="Delete Review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
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
