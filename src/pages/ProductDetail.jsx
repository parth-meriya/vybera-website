import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft, Star, ImageIcon, X, Trash2, Share2, Copy, MessageCircle, AtSign, Camera } from 'lucide-react';
import { getProductById } from '../firebase/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getReviewsByProduct, addReview, deleteReview } from '../firebase/reviews';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import { trackViewProduct, trackAddToCart } from '../utils/analytics';

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    
    Promise.all([
      getProductById(id),
      getReviewsByProduct(id)
    ]).then(([p, rcvs]) => {
      setProduct(p);
      setReviews(rcvs);
      if (p?.sizes?.length) {
        const firstAvailable = p.sizes.find(s => !(p.outOfStockSizes || []).includes(s));
        setSelectedSize(firstAvailable || null);
      } else {
        setSelectedSize('Standard');
      }
      if (p?.colors?.length) {
        setSelectedColor(p.colors[0].name);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  // Track product view
  useEffect(() => {
    if (product) trackViewProduct(product);
  }, [product]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to review.', { className: 'toast-vybera' });
      return;
    }
    if (!reviewText.trim()) {
      toast.error('Review text cannot be empty.', { className: 'toast-vybera' });
      return;
    }
    setSubmittingReview(true);
    try {
      await addReview({
        productId: id,
        userId: user.uid,
        userName: user.displayName || user.email.split('@')[0],
        rating: reviewRating,
        reviewText: reviewText.trim()
      }, reviewImages);
      toast.success('Review submitted!', { className: 'toast-vybera' });
      setReviewText('');
      setReviewImages([]);
      setReviewRating(5);
      
      // Refresh reviews
      const updated = await getReviewsByProduct(id);
      setReviews(updated);
    } catch (err) {
      toast.error(err.message, { className: 'toast-vybera' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleImagePick = (e) => {
    const files = Array.from(e.target.files);
    if (reviewImages.length + files.length > 3) {
      toast.error('Maximum 3 images allowed.', { className: 'toast-vybera' });
      return;
    }
    setReviewImages(prev => [...prev, ...files]);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review deleted.', { className: 'toast-vybera' });
    } catch (err) {
      toast.error('Failed to delete review.', { className: 'toast-vybera' });
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, obj) => acc + obj.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleAddToCart = () => {
    if (product?.sizes?.length > 0 && !selectedSize) {
      toast.error('Please select a size.', { className: 'toast-vybera' });
      return;
    }
    if (product?.colors?.length > 0 && !selectedColor) {
      toast.error('Please select a color.', { className: 'toast-vybera' });
      return;
    }
    const sizeToUse = product?.sizes?.length > 0 ? selectedSize : 'Standard';
    const colorToUse = product?.colors?.length > 0 ? selectedColor : null;
    addItem({ ...product, selectedColor: colorToUse }, sizeToUse, 1);
    trackAddToCart(product, sizeToUse, 1);
    toast.success(`${product.name} added to cart.`, { className: 'toast-vybera' });
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: 'Check this out from VYBERA',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      setShowShareModal(true);
    }
  };

  const copyToClipboard = (msg = 'Link copied') => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(msg, { className: 'toast-vybera' });
    setShowShareModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vy-black pt-24 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-vy-black pt-24 flex flex-col items-center justify-center gap-6">
        <p className="text-vy-grey tracking-widest uppercase text-sm">Product not found</p>
        <Link to="/shop" className="btn-outline">Back to Shop</Link>
      </div>
    );
  }

  const PLACEHOLDER = 'https://placehold.co/800x1000/111111/D9C7A6?text=VYBERA';

  return (
    <div className="min-h-screen bg-vy-black pt-16">
      <SEO
        title={product.name}
        description={product.description?.slice(0, 150) || `Buy ${product.name} from VYBERA. Premium oversized streetwear.`}
        keywords={`${product.name}, streetwear, VYBERA, oversized tee`}
        path={`/product/${product.id}`}
        image={product.images?.[0] || product.image || PLACEHOLDER}
        type="product"
      />
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-12">
        {/* Back */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors mb-8"
        >
          <ArrowLeft size={13} /> Back
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="relative flex flex-col gap-4"
          >
            <div
              className="relative overflow-hidden bg-vy-card border border-vy-border aspect-[3/4] cursor-zoom-in"
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
            >
              <motion.img
                src={product.images?.[0] || product.image || PLACEHOLDER}
                alt={product.name}
                id="main-product-image"
                className="w-full h-full object-cover"
                animate={{ scale: zoomed ? 1.08 : 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              />

            </div>

            {/* Gallery Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => document.getElementById('main-product-image').src = img}
                    className="flex-shrink-0 w-20 h-24 border border-vy-border hover:border-vy-grey transition-colors bg-vy-card"
                  >
                    <img src={img} alt={`view ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col justify-center"
          >
            {product.isDrop && (
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-vy-grey text-xs tracking-[0.4em] uppercase">Limited Drop</span>
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-vy-white">
                {product.name}
              </h1>
              <button 
                onClick={handleShare}
                className="p-2 border border-vy-border text-vy-grey hover:text-vy-white hover:border-vy-white transition-colors bg-vy-card"
                title="Share Product"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Reviews Summary */}
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase">
              <span className="text-yellow-400 flex items-center gap-1">
                <Star size={14} className="fill-current" /> {avgRating || 'No rating'}
              </span>
              <span className="text-vy-grey">({reviews.length} Review{reviews.length !== 1 ? 's' : ''})</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-8 flex-wrap">
              <span className="text-2xl font-semibold text-vy-white">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-lg font-medium text-vy-grey line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-green-500 pb-0.5">
                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-vy-grey text-sm leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Size */}
            {product.sizes?.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-vy-white text-xs font-semibold tracking-widest uppercase">Size</p>
                  <button className="text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors">
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['S', 'M', 'L', 'XL', 'XXL'].map(size => {
                    const exists = product.sizes.includes(size);
                    const isOutOfStock = product.outOfStockSizes?.includes(size);
                    const disabled = !exists || isOutOfStock;

                    return (
                      <div key={size} className="relative group flex flex-col items-center">
                        <button
                          disabled={disabled}
                          onClick={() => !disabled && setSelectedSize(size)}
                          className={`size-btn relative overflow-hidden ${
                            selectedSize === size ? 'selected' : ''
                          } ${disabled ? 'unavailable opacity-40 cursor-not-allowed' : ''}`}
                        >
                          {size}
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-45 scale-150">
                              <div className="w-full h-px bg-vy-grey/50" />
                            </div>
                          )}
                        </button>
                        {isOutOfStock && (
                          <div className="absolute -bottom-6 text-red-400/80 text-[9px] uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Out of Stock
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color */}
            {product.colors?.length > 0 && (
              <div className="mb-8">
                <p className="text-vy-white text-xs font-semibold tracking-widest uppercase mb-4">Color</p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`px-4 py-2 border text-xs tracking-widest uppercase transition-all ${
                        selectedColor === color.name
                          ? 'border-vy-white bg-vy-white text-vy-black'
                          : 'border-vy-border text-vy-grey hover:border-vy-grey hover:text-vy-white'
                      }`}
                    >
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            {product.inStock !== false ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="btn-primary flex items-center justify-center gap-3 w-full md:w-auto"
              >
                <ShoppingBag size={16} />
                Add to Cart
              </motion.button>
            ) : (
              <button
                disabled
                className="btn-primary opacity-50 cursor-not-allowed flex items-center justify-center gap-3 w-full md:w-auto"
              >
                Out of Stock
              </button>
            )}

            {/* Meta */}
            <div className="mt-8 pt-8 border-t border-vy-border">
              <dl className="space-y-3">
                <div className="flex gap-4">
                  <dt className="text-vy-grey text-xs tracking-widest uppercase w-24">Material</dt>
                  <dd className="text-vy-light text-xs">{product.material || '100% Premium Cotton'}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="text-vy-grey text-xs tracking-widest uppercase w-24">Fit</dt>
                  <dd className="text-vy-light text-xs">{product.fit || 'Oversized'}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="text-vy-grey text-xs tracking-widest uppercase w-24">Origin</dt>
                  <dd className="text-vy-light text-xs">Made in India</dd>
                </div>
              </dl>
            </div>
          </motion.div>
        </div>

        {/* --- REVIEWS SECTION --- */}
        <div className="mt-24 border-t border-vy-border pt-16">
          <h2 className="font-display font-bold text-2xl tracking-wider text-vy-white mb-10">
            Customer Reviews
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Write a review form */}
            <div className="lg:col-span-1">
              <div className="bg-vy-card border border-vy-border p-6">
                <h3 className="text-vy-white font-semibold tracking-widest uppercase text-sm mb-6">
                  Write a Review
                </h3>
                {!user ? (
                  <p className="text-vy-grey text-xs">
                    Please <Link to="/login" className="text-vy-white underline">log in</Link> to share your thoughts.
                  </p>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {/* Rating */}
                    <div>
                      <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className={`transition-colors ${star <= reviewRating ? 'text-yellow-400' : 'text-vy-border'} hover:text-yellow-500`}
                          >
                            <Star size={24} className={star <= reviewRating ? 'fill-current' : ''} />
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Text */}
                    <div>
                      <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Review</label>
                      <textarea
                        value={reviewText}
                        onChange={e => setReviewText(e.target.value)}
                        placeholder="What do you think about this piece?"
                        className="vy-input resize-none"
                        rows={4}
                      />
                    </div>
                    {/* Images */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-vy-grey text-xs tracking-widest uppercase block">Images</label>
                        <span className="text-vy-grey text-[10px]">{reviewImages.length}/3 max</span>
                      </div>
                      
                      {reviewImages.length < 3 && (
                        <label className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-vy-border text-vy-grey text-xs uppercase tracking-widest hover:border-vy-grey cursor-pointer transition-colors">
                          <ImageIcon size={14} /> Upload Image
                          <input type="file" multiple accept="image/jpeg, image/png" className="hidden" onChange={handleImagePick} />
                        </label>
                      )}

                      {/* Preview array */}
                      {reviewImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {reviewImages.map((file, idx) => (
                            <div key={idx} className="relative aspect-square border border-vy-border group bg-vy-dark">
                              <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover opacity-80" />
                              <button
                                type="button"
                                onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-vy-white text-vy-black rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="btn-primary w-full text-xs py-3 mt-4"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Right: List of Reviews */}
            <div className="lg:col-span-2 space-y-6">
              {reviews.length === 0 ? (
                <div className="p-8 border border-vy-border text-center">
                  <p className="text-vy-grey tracking-widest uppercase text-sm">No reviews yet.</p>
                </div>
              ) : (
                reviews.map(review => (
                  <div key={review.id} className="p-6 border border-vy-border bg-vy-black relative">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-vy-white font-semibold text-sm tracking-wider mb-1">{review.userName}</p>
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={12} className={s <= review.rating ? "text-yellow-400 fill-current" : "text-vy-border"} />
                          ))}
                        </div>
                        <p className="text-vy-grey text-[10px] uppercase tracking-widest">{review.createdAt?.toDate?.().toLocaleDateString() || 'Just now'}</p>
                      </div>
                      {(user && user.uid === review.userId) && (
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-vy-border hover:text-red-400 transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {/* Text */}
                    <p className="text-vy-light text-sm leading-relaxed mb-4">{review.reviewText}</p>
                    
                    {/* Images */}
                    {review.imageUrls?.length > 0 && (
                      <div className="flex gap-3">
                        {review.imageUrls.map((url, i) => (
                          <div key={i} className="w-16 h-20 border border-vy-border bg-vy-card flex-shrink-0 cursor-zoom-in" onClick={() => window.open(url, '_blank')}>
                            <img src={url} alt={`Review by ${review.userName}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Share Modal (Fallback for Desktop) */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vy-card border border-vy-border w-full max-w-sm p-6 relative"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-vy-grey hover:text-vy-white transition-colors"
              >
                <X size={18} />
              </button>
              
              <h3 className="font-display font-bold tracking-widest text-vy-white mb-6 uppercase text-sm">
                Share Product
              </h3>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => copyToClipboard('Link copied')}
                  className="flex items-center gap-4 p-3 border border-vy-border hover:bg-vy-border/30 transition-colors text-vy-light text-sm"
                >
                  <Copy size={16} /> Copy Link
                </button>
                <button
                  onClick={() => {
                    window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank');
                    setShowShareModal(false);
                  }}
                  className="flex items-center gap-4 p-3 border border-vy-border hover:bg-vy-border/30 transition-colors text-vy-light text-sm"
                >
                  <MessageCircle size={16} /> Share on WhatsApp
                </button>
                <button
                  onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check this out from VYBERA ')}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                    setShowShareModal(false);
                  }}
                  className="flex items-center gap-4 p-3 border border-vy-border hover:bg-vy-border/30 transition-colors text-vy-light text-sm"
                >
                  <AtSign size={16} /> Share on Twitter/X
                </button>
                <button
                  onClick={() => copyToClipboard('Link copied for Instagram')}
                  className="flex items-center gap-4 p-3 border border-vy-border hover:bg-vy-border/30 transition-colors text-vy-light text-sm"
                >
                  <Camera size={16} /> Copy Link for Instagram
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetail;
