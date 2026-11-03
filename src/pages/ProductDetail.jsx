import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Star, ShoppingBag, Plus, Minus, ArrowRight, Share2, Copy, 
  MessageCircle, X, AtSign, Camera, ImageIcon, Trash2,
  Truck, RotateCcw, ShieldCheck, Award, Sparkles, Package, Clock, ArrowLeft
} from 'lucide-react';
import { getProductById } from '../firebase/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getReviewsByProduct, addReview, deleteReview, isVerifiedBuyer } from '../firebase/reviews';
import { getTrustBadges } from '../firebase/content';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';
import { trackViewProduct, trackAddToCart } from '../utils/analytics';
import { getProductPricing } from '../utils/pricing';
import CountdownTimer from '../components/ui/CountdownTimer';
import { getSizeGuideById } from '../firebase/sizeGuides';

const IconMap = {
  Truck,
  RotateCcw,
  ShieldCheck,
  Award,
  Sparkles,
  Package,
  Clock,
  Heart
};

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
  const [verifiedBuyer, setVerifiedBuyer] = useState(false);
  const [trustBadges, setTrustBadges] = useState([]);

  useEffect(() => {
    if (user && id) {
      isVerifiedBuyer(user.uid, id).then(setVerifiedBuyer);
    } else {
      setVerifiedBuyer(false);
    }
  }, [user, id]);
  const [currentImage, setCurrentImage] = useState(null);
  const [zoomed, setZoomed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { addItem, campaign } = useCart();
  const pricing = product ? getProductPricing(product, campaign) : null;

  const [sizeGuide, setSizeGuide] = useState({
    name: 'Standard Size Chart',
    description: 'Chest and length measurements in inches for standard streetwear fits.',
    headers: ['Size', 'Chest (in)', 'Length (in)'],
    rows: [
      ['XS', '36', '26'],
      ['S', '38', '27'],
      ['M', '40', '28'],
      ['L', '42', '29'],
      ['XL', '44', '30'],
      ['XXL', '46', '31']
    ]
  });
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    Promise.all([
      getProductById(id),
      getReviewsByProduct(id),
      getTrustBadges()
    ]).then(([p, rcvs, badges]) => {
      setProduct(p);
      setReviews(rcvs);
      setTrustBadges(badges);
      if (p?.sizeGuideId) {
        getSizeGuideById(p.sizeGuideId).then(g => {
          if (g) setSizeGuide(g);
        });
      }
      if (p?.sizes?.length) {
        const firstAvailable = p.sizes.find(s => !(p.outOfStockSizes || []).includes(s));
        setSelectedSize(firstAvailable || null);
      } else {
        setSelectedSize('Standard');
      }
      if (p?.colors?.length) {
        setSelectedColor(p.colors[0].name);
      }
      setCurrentImage(p.images?.[0] || p.image || null);
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

  // Handle color-based image switching
  useEffect(() => {
    if (product?.colors && selectedColor) {
      const colorData = product.colors.find(c => c.name === selectedColor);
      if (colorData && typeof colorData.imageIndex === 'number' && product.images?.[colorData.imageIndex]) {
        setCurrentImage(product.images[colorData.imageIndex]);
      }
    }
  }, [selectedColor, product]);

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

  const approvedReviews = reviews.filter(r => r.status === 'approved');
  const userReviews = user ? reviews.filter(r => r.userId === user.uid && r.status !== 'approved') : [];
  const displayedReviews = [...userReviews, ...approvedReviews];

  const avgRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((acc, obj) => acc + obj.rating, 0) / approvedReviews.length).toFixed(1)
    : 0;

  const showReviewsSection = approvedReviews.length > 0 || verifiedBuyer;

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
    addItem({ ...product, price: pricing.price, compareAtPrice: pricing.compareAtPrice, selectedColor: colorToUse }, sizeToUse, 1);
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
      <div className="min-h-screen bg-[#FAF5ED] pt-24 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF5ED] pt-24 flex flex-col items-center justify-center gap-6">
        <p className="text-[#75665C] tracking-widest uppercase text-sm">Product not found</p>
        <Link to="/shop" className="btn-primary">Back to Shop</Link>
      </div>
    );
  }

  const PLACEHOLDER = 'https://placehold.co/800x1000/111111/D9C7A6?text=VYBERA';

  const productSchema = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images || [product.image || PLACEHOLDER],
    "description": product.description || `Buy ${product.name} from VYBERA. Premium oversized streetwear.`,
    "sku": product.id,
    "brand": {
      "@type": "Brand",
      "name": "VYBERA"
    },
    "offers": {
      "@type": "Offer",
      "url": typeof window !== 'undefined' ? window.location.href : '',
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  } : null;

  return (
    <div className="min-h-screen bg-[#FAF5ED] pt-16">
      <SEO
        title={product.name}
        description={product.description?.slice(0, 150) || `Buy ${product.name} from VYBERA. Premium oversized streetwear.`}
        keywords={`${product.name}, streetwear, VYBERA, oversized tee`}
        path={`/product/${product.id}`}
        image={product.images?.[0] || product.image || PLACEHOLDER}
        type="product"
        schema={productSchema}
      />
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-12">
        {/* Back */}
        <div className="mb-8">
          <BackButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="relative flex flex-col gap-4"
          >
            <div
              className="relative overflow-hidden bg-[#F3E7D8] border border-[#D4BEA5] aspect-[3/4] cursor-zoom-in"
              onMouseEnter={() => setZoomed(true)}
              onMouseLeave={() => setZoomed(false)}
            >
              <motion.img
                src={currentImage || PLACEHOLDER}
                alt={product.name}
                id="main-product-image"
                className="w-full h-full object-cover"
                animate={{ scale: zoomed ? 1.08 : 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              />

            </div>

            {/* Gallery Thumbnails */}
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2 mt-2">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentImage(img)}
                    className={`aspect-[3/4] border-2 transition-all bg-[#F3E7D8] overflow-hidden ${
                      currentImage === img ? 'border-[#590907] ring-1 ring-[#590907] shadow-md' : 'border-[#D4BEA5] hover:border-[#75665C]'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
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
                <span className="w-1.5 h-1.5 bg-[#590907] rounded-full animate-pulse" />
                <span className="text-[#75665C] text-xs tracking-[0.4em] uppercase font-bold">Limited Drop</span>
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-[#30231F]">
                {product.name}
              </h1>
              <button 
                onClick={handleShare}
                className="p-2 border border-[#D4BEA5] text-[#75665C] hover:text-[#590907] hover:border-[#590907] transition-colors bg-[#FAF5ED]"
                title="Share Product"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Reviews Summary */}
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase">
              <span className="text-amber-800 flex items-center gap-1 font-bold">
                <Star size={14} className="fill-current text-amber-500" /> {avgRating || 'No rating'}
              </span>
              <span className="text-[#75665C]">({approvedReviews.length} Review{approvedReviews.length !== 1 ? 's' : ''})</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-4 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold text-[#590907] font-mono">
                ₹{pricing ? pricing.price.toLocaleString() : ''}
              </span>
              {pricing?.compareAtPrice && pricing.compareAtPrice > pricing.price && (
                <>
                  <span className="text-lg font-medium text-[#75665C] line-through font-mono">
                    ₹{pricing.compareAtPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 pb-0.5">
                    -{pricing.discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Campaign Countdown Timer */}
            {campaign?.active && campaign?.endDate && (
              <CountdownTimer endDate={campaign.endDate} campaignName={campaign.name} />
            )}

            {/* Description */}
            {product.description && (
              <p className="text-[#75665C] text-sm leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Size */}
            {product.sizes?.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#30231F] text-xs font-bold tracking-widest uppercase">Size</p>
                  <button 
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[#75665C] text-xs tracking-widest uppercase hover:text-[#590907] transition-colors font-semibold"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL']
                    .filter(size => {
                      const exists = product.sizes.includes(size);
                      const colorData = product.colors?.find(c => c.name === selectedColor);
                      const isColorOOS = colorData?.outOfStockSizes?.includes(size);
                      // If it doesn't exist globally, or is specifically removed for this color, hide it
                      return exists && !isColorOOS;
                    })
                    .map(size => {
                      const isOutOfStock = product.outOfStockSizes?.includes(size);
                      const disabled = isOutOfStock;

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
                              <div className="w-full h-px bg-[#75665C]/50" />
                            </div>
                          )}
                        </button>
                        {isOutOfStock && (
                          <div className="absolute -bottom-6 text-rose-700 text-[9px] uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold">
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
                <p className="text-[#30231F] text-xs font-bold tracking-widest uppercase mb-4">Color</p>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`px-4 py-2 border text-xs tracking-widest uppercase transition-all font-semibold ${
                        selectedColor === color.name
                          ? 'border-[#590907] bg-[#590907] text-white'
                          : 'border-[#D4BEA5] text-[#30231F] bg-white hover:border-[#590907]'
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

            {/* Dynamic Trust Badges */}
            {trustBadges.filter(b => b.active).length > 0 && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border border-[#D4BEA5] bg-[#F3E7D8]/60 p-4">
                {trustBadges.filter(b => b.active).map((badge, i) => {
                  const IconComponent = IconMap[badge.icon] || Truck;
                  return (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="text-[#590907] mt-0.5 flex-shrink-0">
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <h4 className="text-[#30231F] text-[11px] font-bold uppercase tracking-wider leading-tight mb-1">
                          {badge.title}
                        </h4>
                        <p className="text-[#75665C] text-[9px] leading-relaxed uppercase tracking-wide">
                          {badge.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Meta */}
            <div className="mt-8 pt-8 border-t border-[#D4BEA5]">
              <dl className="space-y-3">
                <div className="flex gap-4">
                  <dt className="text-[#75665C] text-xs tracking-widest uppercase w-24 font-semibold">Material</dt>
                  <dd className="text-[#30231F] text-xs font-medium">{product.material || '100% Premium Cotton'}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="text-[#75665C] text-xs tracking-widest uppercase w-24 font-semibold">Fit</dt>
                  <dd className="text-[#30231F] text-xs font-medium">{product.fit || 'Oversized'}</dd>
                </div>
                <div className="flex gap-4">
                  <dt className="text-[#75665C] text-xs tracking-widest uppercase w-24 font-semibold">Origin</dt>
                  <dd className="text-[#30231F] text-xs font-medium">Made in India</dd>
                </div>
              </dl>
            </div>
          </motion.div>
        </div>

        {/* --- REVIEWS SECTION --- */}
        {showReviewsSection && (
          <div className="mt-24 border-t border-[#D4BEA5] pt-16">
            <h2 className="font-display font-bold text-2xl tracking-wider text-[#30231F] mb-10">
              Customer Reviews
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column: Analytics & Form */}
              <div className="lg:col-span-1 space-y-8">
                {/* Rating summary */}
                <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
                  <h3 className="text-[#30231F] font-bold tracking-widest uppercase text-sm mb-4">
                    Rating Summary
                  </h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-bold text-[#30231F] font-display">{avgRating}</span>
                    <span className="text-[#75665C] text-sm font-semibold">/ 5.0</span>
                    <div className="flex gap-0.5 text-amber-500 ml-3">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} className={s <= Math.round(Number(avgRating)) ? 'fill-current' : ''} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[#75665C] text-xs tracking-wider uppercase mb-6 font-medium">Based on {approvedReviews.length} verified review{approvedReviews.length !== 1 ? 's' : ''}</p>
                  
                  <div className="space-y-3">
                    {[5,4,3,2,1].map(stars => {
                      const count = approvedReviews.filter(r => r.rating === stars).length;
                      const pct = approvedReviews.length > 0 ? (count / approvedReviews.length) * 100 : 0;
                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs">
                          <span className="text-[#30231F] w-3 font-semibold">{stars}★</span>
                          <div className="flex-1 h-2 bg-[#F3E7D8] border border-[#D4BEA5]/60 rounded-full overflow-hidden">
                            <div className="h-full bg-[#590907]" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[#75665C] w-8 text-right font-medium">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Write a review form */}
                <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
                  <h3 className="text-[#30231F] font-bold tracking-widest uppercase text-sm mb-6">
                    Write a Review
                  </h3>
                  {!user ? (
                    <p className="text-[#75665C] text-xs">
                      Please <Link to="/login" className="text-[#590907] underline font-bold">log in</Link> to share your thoughts.
                    </p>
                  ) : !verifiedBuyer ? (
                    <p className="text-[#75665C] text-xs leading-relaxed">
                      Only verified buyers who purchased this product can leave a review.
                    </p>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-4">
                      {/* Rating */}
                      <div>
                        <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`transition-colors ${star <= reviewRating ? 'text-amber-500' : 'text-[#D4BEA5]'} hover:text-amber-600`}
                            >
                              <Star size={24} className={star <= reviewRating ? 'fill-current' : ''} />
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Text */}
                      <div>
                        <label className="text-[#75665C] text-xs tracking-widest uppercase block mb-2 font-semibold">Review</label>
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
                          <label className="text-[#75665C] text-xs tracking-widest uppercase block font-semibold">Images</label>
                          <span className="text-[#75665C] text-[10px]">{reviewImages.length}/3 max</span>
                        </div>
                        
                        {reviewImages.length < 3 && (
                          <label className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#D4BEA5] text-[#75665C] text-xs uppercase tracking-widest hover:border-[#590907] hover:text-[#590907] cursor-pointer transition-colors bg-white">
                            <ImageIcon size={14} /> Upload Image
                            <input type="file" multiple accept="image/jpeg, image/png" className="hidden" onChange={handleImagePick} />
                          </label>
                        )}

                        {/* Preview array */}
                        {reviewImages.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-3">
                            {reviewImages.map((file, idx) => (
                              <div key={idx} className="relative aspect-square border border-[#D4BEA5] group bg-white shadow-sm">
                                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-[#590907] text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform"
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
                {displayedReviews.length === 0 ? (
                  <div className="p-8 border border-[#D4BEA5] text-center bg-[#FAF5ED]">
                    <p className="text-[#75665C] tracking-widest uppercase text-sm font-semibold">No reviews yet.</p>
                  </div>
                ) : (
                  displayedReviews.map(review => (
                    <div key={review.id} className="p-6 border border-[#D4BEA5] bg-[#FAF5ED] shadow-sm relative">
                      {review.status !== 'approved' && (
                        <span className={`absolute top-6 right-6 px-2.5 py-0.5 text-[9px] uppercase tracking-widest font-bold rounded ${
                          review.status === 'rejected' 
                            ? 'badge-cancelled' 
                            : 'badge-pending'
                        }`}>
                          {review.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                        </span>
                      )}
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[#30231F] font-bold text-sm tracking-wider mb-1">{review.userName}</p>
                          <div className="flex gap-1 mb-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={13} className={s <= review.rating ? "text-amber-500 fill-current" : "text-[#D4BEA5]"} />
                            ))}
                          </div>
                          <p className="text-[#75665C] text-[10px] uppercase tracking-widest">{review.createdAt?.toDate?.().toLocaleDateString() || 'Just now'}</p>
                        </div>
                        {(user && user.uid === review.userId) && (
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="text-[#75665C] hover:text-rose-700 transition-colors"
                            title="Delete Review"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      {/* Text */}
                      <p className="text-[#30231F] text-sm leading-relaxed mb-4">{review.reviewText}</p>
                      
                      {/* Images */}
                      {review.imageUrls?.length > 0 && (
                        <div className="flex gap-3">
                          {review.imageUrls.map((url, i) => (
                            <div key={i} className="w-16 h-20 border border-[#D4BEA5] bg-white flex-shrink-0 cursor-zoom-in" onClick={() => window.open(url, '_blank')}>
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
        )}

        {/* Share Modal (Fallback for Desktop) */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#FAF5ED] border border-[#D4BEA5] w-full max-w-sm p-6 relative shadow-xl"
            >
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-[#75665C] hover:text-[#590907] transition-colors"
              >
                <X size={18} />
              </button>
              
              <h3 className="font-display font-bold tracking-widest text-[#30231F] mb-6 uppercase text-sm">
                Share Product
              </h3>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => copyToClipboard('Link copied')}
                  className="flex items-center gap-4 p-3 border border-[#D4BEA5] hover:bg-[#F3E7D8] transition-colors text-[#30231F] text-sm font-semibold"
                >
                  <Copy size={16} /> Copy Link
                </button>
                <button
                  onClick={() => {
                    window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank');
                    setShowShareModal(false);
                  }}
                  className="flex items-center gap-4 p-3 border border-[#D4BEA5] hover:bg-[#F3E7D8] transition-colors text-[#30231F] text-sm font-semibold"
                >
                  <MessageCircle size={16} /> Share on WhatsApp
                </button>
                <button
                  onClick={() => {
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check this out from VYBERA ')}&url=${encodeURIComponent(window.location.href)}`, '_blank');
                    setShowShareModal(false);
                  }}
                  className="flex items-center gap-4 p-3 border border-[#D4BEA5] hover:bg-[#F3E7D8] transition-colors text-[#30231F] text-sm font-semibold"
                >
                  <AtSign size={16} /> Share on Twitter/X
                </button>
                <button
                  onClick={() => copyToClipboard('Link copied for Instagram')}
                  className="flex items-center gap-4 p-3 border border-[#D4BEA5] hover:bg-[#F3E7D8] transition-colors text-[#30231F] text-sm font-semibold"
                >
                  <Camera size={16} /> Copy Link for Instagram
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Size Guide Modal */}
        <AnimatePresence>
          {sizeGuideOpen && sizeGuide && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#FAF5ED] border border-[#D4BEA5] w-full max-w-lg p-6 relative shadow-xl"
              >
                <button 
                  onClick={() => setSizeGuideOpen(false)} 
                  className="absolute top-4 right-4 text-[#75665C] hover:text-[#590907] transition-colors"
                >
                  <X size={18} />
                </button>

                <h2 className="font-display font-bold text-xl tracking-wider text-[#30231F] uppercase mb-2">
                  {sizeGuide.name}
                </h2>
                {sizeGuide.description && (
                  <p className="text-[#75665C] text-xs mb-6 leading-relaxed">
                    {sizeGuide.description}
                  </p>
                )}

                {/* Table */}
                <div className="overflow-x-auto border border-[#D4BEA5] bg-white mb-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D4BEA5] text-[#75665C] uppercase font-bold tracking-widest bg-[#F3E7D8]/60">
                        {sizeGuide.headers?.map((h, i) => (
                          <th key={i} className="p-3 border-r border-[#D4BEA5]/40 last:border-r-0 text-center">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizeGuide.rows?.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-[#D4BEA5]/20 text-[#30231F] last:border-0 hover:bg-[#F3E7D8]/30">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-3 border-r border-[#D4BEA5]/20 last:border-r-0 text-center font-medium">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Measurement tips */}
                <div className="p-4 border border-[#D4BEA5] bg-[#F3E7D8]/60 text-[#75665C] text-xs space-y-2 leading-relaxed">
                  <h4 className="text-[#30231F] font-bold uppercase tracking-wider text-[11px] mb-1">How to Measure:</h4>
                  <p><strong>Chest:</strong> Measure around the fullest part of your chest, keeping the tape horizontal.</p>
                  <p><strong>Length:</strong> Measure from the highest point of the shoulder down to the hem.</p>
                </div>

                <div className="mt-6 text-right">
                  <button 
                    onClick={() => setSizeGuideOpen(false)}
                    className="btn-primary text-xs"
                  >
                    Got It
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ProductDetail;
