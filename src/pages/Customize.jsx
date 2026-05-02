import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload, X, CheckCircle, AlertCircle, Loader2,
  Shirt, ChevronRight, Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { uploadCustomDesign, createCustomOrder } from '../firebase/customOrders';
import { validateCoupon } from '../firebase/coupons';
import { openRazorpay } from '../utils/razorpay';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const POSITION_PRICES = { Front: 700, Back: 700, Both: 900 };
const SIZES      = ['S', 'M', 'L', 'XL'];
const POSITIONS  = ['Front', 'Back', 'Both'];

// ── Sub-components ──────────────────────────────────────
const StepLabel = ({ n, label, active, done }) => (
  <div className={`flex items-center gap-2 ${done ? 'text-vy-white' : active ? 'text-vy-white' : 'text-vy-border'}`}>
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
      done ? 'bg-vy-white border-vy-white text-vy-black' :
      active ? 'border-vy-white text-vy-white' :
      'border-vy-border text-vy-border'
    }`}>{done ? '✓' : n}</div>
    <span className="text-xs tracking-widest uppercase hidden md:block">{label}</span>
  </div>
);

const TshirtPreview = ({ color, position, imageUrls, viewMode }) => {
  const isLight = () => {
    if (!color.startsWith('#')) return true;
    const hex = color.replace('#', '');
    if (hex.length < 6) return true;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 2), 16);
    const b = parseInt(hex.substring(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128;
  };
  const bg = color || '#f5f5f5';
  const textColor = isLight() ? '#111' : '#f5f5f5';

  const isBack = viewMode === 'Back';
  const collarPath = isBack
    ? "M60,10 L30,40 L10,30 L0,70 L35,75 L35,210 L165,210 L165,75 L200,70 L190,30 L170,40 L140,10 Q120,5 100,5 Q80,5 60,10Z"
    : "M60,10 L30,40 L10,30 L0,70 L35,75 L35,210 L165,210 L165,75 L200,70 L190,30 L170,40 L140,10 Q120,20 100,20 Q80,20 60,10Z";

  let activeImageUrl = null;
  if (imageUrls && imageUrls.length > 0) {
    if (position === 'Both') {
      activeImageUrl = isBack ? (imageUrls[1] || imageUrls[0]) : imageUrls[0];
    } else if (position === 'Front' && !isBack) {
      activeImageUrl = imageUrls[0];
    } else if (position === 'Back' && isBack) {
      activeImageUrl = imageUrls[0];
    }
  }

  const isZoneActive = (position === 'Both') || (position === 'Front' && !isBack) || (position === 'Back' && isBack);

  return (
    <motion.div
      key={`${color}-${viewMode}`}
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col items-center justify-center p-4"
    >
      <div
        className="relative w-56 h-64 flex items-center justify-center"
        style={{ filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))' }}
      >
        <svg viewBox="0 0 200 220" className="w-full h-full absolute inset-0" fill={bg} stroke={isLight() ? '#ddd' : '#333'} strokeWidth="1">
          <path d={collarPath} />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 pt-10 pb-4 gap-2 pointer-events-none">
          {isZoneActive && activeImageUrl ? (
            <div className="w-20 h-28 flex flex-col items-center justify-center overflow-hidden bg-black/10 border border-dashed border-white/20 rounded-sm">
               <img src={activeImageUrl} alt="design" className="w-full max-h-full object-contain drop-shadow" />
            </div>
          ) : isZoneActive ? (
            <div className="w-20 h-28 flex flex-col items-center justify-center border border-dashed opacity-40 rounded-sm" style={{ borderColor: textColor }}>
              <span className="text-[10px] tracking-widest font-bold mb-1" style={{ color: textColor }}>{viewMode.toUpperCase()}</span>
              <span className="text-[8px] text-center px-1" style={{ color: textColor }}>DRAG & DROP <br/> DESIGN</span>
            </div>
          ) : null}
          <span className="text-[10px] tracking-widest font-bold opacity-30 mt-auto" style={{ color: textColor }}>VYBERA</span>
        </div>
      </div>
    </motion.div>
  );
};

// ── Upload Zone ─────────────────────────────────────────
const UploadZone = ({ files, previews, onFiles, onRemove, uploading, progress }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const processFiles = (fileList) => {
    const valid = Array.from(fileList).filter(f => {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)) {
        toast.error(`${f.name} is not JP/PNG.`, { className: 'toast-vybera' });
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} is over 10MB.`, { className: 'toast-vybera' });
        return false;
      }
      return true;
    });
    if (valid.length > 0) onFiles(valid);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-vy-grey text-xs tracking-widest uppercase block">
          Upload Your Designs ({files.length}/3) *
        </label>
      </div>

      {files.length < 3 && (
        <motion.div
          className={`border border-dashed transition-colors duration-300 flex flex-col items-center justify-center gap-3 p-10 cursor-pointer mb-4 ${
            dragging ? 'border-vy-white bg-white/5' : 'border-vy-border hover:border-vy-grey'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Upload size={28} className="text-vy-grey" />
          <div className="text-center">
            <p className="text-vy-white text-sm font-medium">Drag & drop or click to upload</p>
            <p className="text-vy-grey text-xs mt-1">JPG, PNG — max 10MB</p>
          </div>
        </motion.div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {previews.map((prev, idx) => (
            <div key={idx} className="relative border border-vy-border bg-vy-card group">
              <img src={prev} alt={`Preview ${idx + 1}`} className="w-full h-32 object-contain bg-vy-dark p-2" />
              
              {/* Upload progress overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-vy-black/80 flex flex-col items-center justify-center">
                  <Loader2 size={16} className="text-vy-white animate-spin mb-2" />
                  <p className="text-vy-grey text-[10px]">{progress}%</p>
                </div>
              )}

              {!uploading && (
                <button
                  onClick={() => onRemove(idx)}
                  className="absolute top-1 right-1 p-1 bg-vy-black/80 text-vy-grey hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png"
        onChange={(e) => processFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

const Customize = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [files, setFiles]         = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const [size, setSize]           = useState('M');
  const [color, setColor]         = useState('#f5f5f5');
  const [position, setPosition]   = useState('Both');
  const [viewMode, setViewMode]   = useState('Front');
  const [description, setDescription] = useState('');

  const [couponCode, setCouponCode]   = useState('');
  const [coupon, setCoupon]           = useState(null);
  const [discount, setDiscount]       = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [paymentState, setPaymentState] = useState('idle');
  const [step, setStep] = useState(1); 

  const basePrice     = POSITION_PRICES[position];
  const finalPrice    = Math.max(0, basePrice - discount);

  const handlePositionChange = (pos) => {
    setPosition(pos);
    if (pos === 'Back') setViewMode('Back');
    if (pos === 'Front') setViewMode('Front');
  };

  // ── File handling ──────────────────────────────────
  const handleFiles = async (selectedFiles) => {
    let toAdd = Array.from(selectedFiles);
    if (files.length + toAdd.length > 3) {
      toast.error('You can upload a maximum of 3 designs.', { className: 'toast-vybera' });
      toAdd = toAdd.slice(0, 3 - files.length);
    }
    if (toAdd.length === 0) return;

    setFiles(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);

    if (!user) return; 

    setUploading(true);
    setUploadPct(0);
    try {
      // Simulate progress somewhat
      let completed = 0;
      const step = 100 / toAdd.length;

      const urls = await Promise.all(
        toAdd.map(async (f) => {
          const u = await uploadCustomDesign(f, user.uid, () => {});
          completed += step;
          setUploadPct(Math.round(completed));
          return u;
        })
      );
      setImageUrls(prev => [...prev, ...urls]);
    } catch (err) {
      toast.error('Image upload failed. Please try again.', { className: 'toast-vybera' });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
    setImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Coupon ──────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const result = await validateCoupon(couponCode.trim().toUpperCase(), basePrice);
      if (result.valid) {
        setCoupon(result.coupon);
        setDiscount(result.discountAmount);
        toast.success(`Coupon applied! −₹${result.discountAmount}`, { className: 'toast-vybera' });
      } else {
        setCouponError(result.message || 'Invalid coupon');
        setCoupon(null);
        setDiscount(0);
      }
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  // ── Validation ──────────────────────────────────────
  const handleContinue = () => {
    if (!user) {
      toast.error('Please sign in to order a custom product.', { className: 'toast-vybera' });
      navigate('/login');
      return;
    }
    if (files.length === 0) {
      toast.error('Please upload your design images.', { className: 'toast-vybera' });
      return;
    }
    if (uploading) {
      toast.error('Please wait for the images to finish uploading.', { className: 'toast-vybera' });
      return;
    }
    if (imageUrls.length !== files.length) {
      toast.error('Image uploads did not complete securely. Please try again.', { className: 'toast-vybera' });
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Payment ─────────────────────────────────────────
  const handleOrder = async () => {
    setPaymentState('paying');

    try {
      const receipt = `custom_${user.uid.slice(0, 8)}_${Date.now()}`;

      await openRazorpay({
        amount: finalPrice,
        receipt,
        description: `VYBERA Custom Tee — ${position} print (${color}, ${size})`,
        prefill: { email: user.email, name: user.displayName || '' },

        onSuccess: async (response) => {
          try {
              await createCustomOrder({
              userId: user.uid,
              userEmail: user.email,
              userName: user.displayName || '',
              imageUrls,
              size,
              color,
              position,
              description: description.trim(),
              basePrice,
              discount,
              price: finalPrice,
              couponCode: coupon?.code || null,
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id || response.backendOrderId || null,
              razorpaySignature: response.razorpay_signature || null,
              paymentReceipt: receipt,
            });

            setPaymentState('success');
            toast.success('Custom order placed! We\'ll get in touch soon.', {
              className: 'toast-vybera',
              duration: 5000,
            });
            setTimeout(() => navigate('/order-success'), 1000);
          } catch (dbErr) {
            console.error('Firestore save failed:', dbErr);
            setPaymentState('success');
            toast.success('Payment successful! Our team will reach out within 24 hours.', {
              className: 'toast-vybera',
              duration: 7000,
            });
            setTimeout(() => navigate('/order-success'), 1200);
          }
        },

        onFailure: (error) => {
          setPaymentState('failed');
          setStep(2);
          const msg = error?.description || error?.reason || 'Payment was not completed.';
          toast.error(msg, { className: 'toast-vybera' });
        },
      });
    } catch (err) {
      setPaymentState('failed');
      setStep(2);
      toast.error(err.message || 'Failed to initiate payment.', { className: 'toast-vybera' });
    }
  };

  // ── Render ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-vy-black pt-24">
      <SEO
        title="Customize Your T-Shirt"
        description="Design your own custom premium oversized tee. Upload your artwork, choose your print placement, and we'll bring it to life."
        keywords="custom t-shirts India, design your own tee, custom oversized t-shirt, custom streetwear, print on demand streetwear"
        path="/customize"
      />
      <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-vy-grey text-xs tracking-widest uppercase mb-2">Studio</p>
          <h1 className="font-display font-bold text-4xl md:text-5xl tracking-wider text-vy-white mb-4">
            Customize
          </h1>
          <p className="text-vy-grey text-sm max-w-lg leading-relaxed">
            Upload your design, choose your options, and we'll print and deliver a premium oversized tee — built exactly to your spec.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-10">
          <StepLabel n={1} label="Design" active={step === 1} done={step > 1} />
          <div className={`flex-1 max-w-12 h-px transition-colors duration-500 ${step > 1 ? 'bg-vy-white' : 'bg-vy-border'}`} />
          <StepLabel n={2} label="Review & Pay" active={step === 2} done={paymentState === 'success'} />
        </div>

        {/* Payment processing overlay */}
        <AnimatePresence>
          {paymentState === 'paying' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-vy-black/90 flex items-center justify-center flex-col gap-5"
            >
              <Loader2 size={48} className="text-vy-white animate-spin" />
              <p className="text-vy-white font-semibold tracking-wider">Processing your order…</p>
              <p className="text-vy-grey text-sm">Complete the payment in the Razorpay window</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Design Options ────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-10"
            >
              {/* Left: Options */}
              <div className="lg:col-span-3 space-y-8">

                {/* Upload */}
                <UploadZone
                  files={files}
                  previews={previews}
                  onFiles={handleFiles}
                  onRemove={removeFile}
                  uploading={uploading}
                  progress={uploadPct}
                />

                {/* Size */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-3">Size</label>
                  <div className="flex gap-2">
                    {SIZES.map(s => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`size-btn ${size === s ? 'selected' : ''}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-3">
                    T-Shirt Hex Color
                  </label>
                  <div className="flex gap-4 items-center">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-14 h-14 p-0 border-0 cursor-pointer bg-transparent rounded-full overflow-hidden"
                      title="Choose Color"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value.toUpperCase())}
                      className="vy-input w-full text-sm font-mono tracking-widest uppercase"
                      placeholder="#F5F5F5"
                      maxLength={7}
                    />
                  </div>
                </div>

                {/* Print Position */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-3">
                    Print Position
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {POSITIONS.map(pos => (
                      <button
                        key={pos}
                        onClick={() => handlePositionChange(pos)}
                        className={`py-3 px-4 border text-sm font-medium tracking-wider transition-all duration-200 ${
                          position === pos
                            ? 'border-vy-white bg-vy-white text-vy-black'
                            : 'border-vy-border text-vy-grey hover:border-vy-grey hover:text-vy-white'
                        }`}
                      >
                        <span className="block">{pos}</span>
                        <span className={`text-xs font-normal mt-0.5 block ${position === pos ? 'text-vy-black/70' : 'text-vy-border'}`}>
                          ₹{POSITION_PRICES[pos].toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-vy-white text-[13px] mt-4 block p-3 border border-vy-white/10 bg-vy-white/5">
                    <strong>Note:</strong> If your print design is small, we will automatically refund the price difference.
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-3">
                    Add your design instructions
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="vy-input resize-none w-full text-sm leading-relaxed"
                    placeholder="e.g. Print size: A4, placement: chest-center, keep white space around design, exact color match required..."
                  />
                  <p className="text-vy-border text-xs mt-1 text-right">{description.length}/1000</p>
                </div>

                {!user && (
                  <div className="p-4 border border-yellow-500/30 bg-yellow-500/5">
                    <p className="text-yellow-400 text-xs">
                      You need to{' '}
                      <Link to="/login" className="underline font-semibold">sign in</Link>
                      {' '}before placing a custom order.
                    </p>
                  </div>
                )}

                <motion.button
                  onClick={handleContinue}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary flex items-center gap-2"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading image…' : 'Continue to Review'}
                  {!uploading && <ChevronRight size={16} />}
                </motion.button>
              </div>

              {/* Right: Live Preview */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-28">
                  <p className="text-vy-grey text-xs tracking-widest uppercase mb-5">Live Preview</p>
                  <div className="bg-vy-card border border-vy-border p-8 flex flex-col items-center gap-6">
                    
                    <div className="flex items-center gap-2 w-full justify-center bg-vy-dark p-1 border border-vy-border/50">
                      <button 
                        onClick={() => setViewMode('Front')} 
                        className={`px-6 py-2 text-xs uppercase tracking-widest transition-colors flex-1 ${viewMode === 'Front' ? 'bg-vy-border text-vy-white' : 'text-vy-grey hover:text-vy-white'}`}
                      >
                        Front
                      </button>
                      <button 
                        onClick={() => setViewMode('Back')} 
                        className={`px-6 py-2 text-xs uppercase tracking-widest transition-colors flex-1 ${viewMode === 'Back' ? 'bg-vy-border text-vy-white' : 'text-vy-grey hover:text-vy-white'}`}
                      >
                        Back
                      </button>
                    </div>

                    <TshirtPreview color={color} position={position} imageUrls={previews} viewMode={viewMode} />

                    <div className="w-full space-y-2 text-xs">
                      {[
                        ['Size', size],
                        ['Color', color],
                        ['Print', position],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-vy-grey">
                          <span>{k}</span>
                          <span className="text-vy-white font-medium">{v}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-vy-border pt-2 text-vy-white font-semibold">
                        <span>Base Price</span>
                        <span>₹{basePrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Design tip */}
                  <div className="mt-4 p-4 border border-vy-border bg-vy-card/50">
                    <p className="text-vy-grey text-xs leading-relaxed">
                      <span className="text-vy-white font-semibold">Pro tip:</span> Upload high-res designs (min 300 DPI) for best print quality. PNG with transparent background works best.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Review & Pay ──────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-10"
            >
              {/* Left: Review */}
              <div className="lg:col-span-2 space-y-6">

                {/* Design review */}
                <div className="bg-vy-card border border-vy-border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-vy-white text-sm font-semibold tracking-widest uppercase">Your Design</h2>
                    <button
                      onClick={() => setStep(1)}
                      className="text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2">
                       {previews.map((p, i) => (
                         <img key={i} src={p} alt="Design" className="w-16 h-16 object-contain bg-vy-dark border border-vy-border" />
                       ))}
                    </div>
                    <div className="space-y-1.5">
                      {[
                        ['Size', size],
                        ['Color', color],
                        ['Print Position', position],
                      ].map(([k, v]) => (
                        <p key={k} className="text-vy-grey text-xs">
                          <span className="text-vy-white font-medium mr-2">{k}:</span>{v}
                        </p>
                      ))}
                      {description && (
                        <p className="text-vy-grey text-xs mt-2 leading-relaxed max-w-xs">
                          <span className="text-vy-white font-medium">Notes: </span>
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Coupon */}
                <div className="bg-vy-card border border-vy-border p-6">
                  <h2 className="text-vy-white text-sm font-semibold tracking-widest uppercase mb-4">Coupon Code</h2>

                  {coupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-green-400 text-sm font-semibold">{coupon.code}</span>
                        <span className="text-green-400/70 text-xs">−₹{discount}</span>
                      </div>
                      <button onClick={removeCoupon} className="text-vy-grey hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <input
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                        className="vy-input flex-1 font-mono uppercase text-sm"
                        placeholder="VYBERA20"
                      />
                      <button
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="btn-ghost text-xs disabled:opacity-40"
                      >
                        {couponLoading ? '…' : 'Apply'}
                      </button>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertCircle size={11} /> {couponError}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Pay */}
              <div className="h-fit lg:sticky lg:top-24">
                <div className="bg-vy-card border border-vy-border p-6 space-y-4">
                  <h2 className="text-vy-white font-semibold tracking-widest uppercase text-sm">Order Total</h2>

                  {/* Price breakdown */}
                  <div className="space-y-2 pb-4 border-b border-vy-border text-sm">
                    <div className="flex justify-between">
                      <span className="text-vy-grey">Custom Tee ({position})</span>
                      <span className="text-vy-white">₹{basePrice.toLocaleString()}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-400 flex items-center gap-1"><CheckCircle size={11} /> Coupon</span>
                        <span className="text-green-400">−₹{discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-vy-grey">Shipping</span>
                      <span className="text-green-400">Free</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-vy-grey">Total</span>
                    <div className="text-right">
                      <span className="text-vy-white font-bold text-2xl">₹{finalPrice.toLocaleString()}</span>
                      {discount > 0 && (
                        <p className="text-vy-grey text-xs line-through">₹{basePrice.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Turnaround info */}
                  <div className="p-3 border border-vy-border/50 bg-vy-border/10 text-xs text-vy-grey space-y-1">
                    <p>🕐 Turnaround: 5–7 business days</p>
                    <p>📦 Free shipping across India</p>
                    <p>📞 We'll call to confirm your design</p>
                  </div>
                  
                  {/* Policy Info */}
                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-xs text-red-400 space-y-1">
                    <p className="font-semibold tracking-widest uppercase">⚠️ Strict No Return Policy</p>
                    <p className="text-vy-grey">Since this item is customized specifically for you, all custom order sales are final and non-refundable.</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-vy-grey">
                    <span>Secured by</span>
                    <span className="text-vy-white font-bold tracking-widest">RAZORPAY</span>
                  </div>

                  <motion.button
                    onClick={handleOrder}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4"
                  >
                    <Shirt size={16} />
                    Order Custom Tee — ₹{finalPrice.toLocaleString()}
                  </motion.button>

                  <p className="text-vy-grey text-[10px] text-center leading-relaxed">
                    By ordering, you confirm you have rights to use the uploaded design.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Customize;
