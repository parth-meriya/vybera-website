import { useState, useEffect, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Upload, X, CheckCircle, AlertCircle, Loader2,
  Shirt, ChevronRight, Image as ImageIcon, MessageCircle, Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { uploadCustomDesign } from '../firebase/customOrders';
import { getCustomizeSettings } from '../firebase/content';
import { validateCoupon } from '../firebase/coupons';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const POSITIONS  = ['Front', 'Back', 'Both'];

const ShirtOutline = ({ color = '#0A0A0A' }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl" style={{ transition: 'all 0.5s ease' }}>
    <path
      d="M 20,20 
         L 32,15 
         C 37,20 43,20 50,22 
         C 57,20 63,20 68,15 
         L 80,20 
         L 76,38 
         L 70,36 
         L 70,85 
         C 70,87 68,89 65,89
         L 35,89 
         C 32,89 30,87 30,85
         L 30,36 
         L 24,38 
         Z"
      fill={color}
      stroke="#1f2937"
      strokeWidth="1"
    />
    {/* Collar detail */}
    <path
      d="M 32,15 C 37,20 43,20 50,22 C 57,20 63,20 68,15"
      fill="none"
      stroke="#374151"
      strokeWidth="1.5"
    />
    {/* Left sleeve seam */}
    <path
      d="M 30,32 L 20,20"
      fill="none"
      stroke="#111827"
      strokeWidth="0.5"
    />
    {/* Right sleeve seam */}
    <path
      d="M 70,32 L 80,20"
      fill="none"
      stroke="#111827"
      strokeWidth="0.5"
    />
  </svg>
);

// ── Image Compression Settings ──────────────────────────
const compressionOptions = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1000,
  useWebWorker: true,
  fileType: 'image/webp'
};

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

      <div className="flex flex-wrap gap-3 mt-4">
        <button
          type="button"
          onClick={() => {
            const msg = `Hi VYBERA, I want to order a custom t-shirt. My email is ${encodeURIComponent(window.userEmail || '')}. I will send my design here.`;
            window.open(`https://wa.me/917043568477?text=${msg}`, '_blank');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-[10px] uppercase font-bold tracking-widest hover:bg-[#25D366]/20 transition-all"
        >
          <MessageCircle size={14} /> Submit via WhatsApp
        </button>
        <button
          type="button"
          onClick={() => onFiles('LATER')}
          className="flex items-center gap-2 px-4 py-2 bg-vy-white/5 border border-vy-white/10 text-vy-grey text-[10px] uppercase font-bold tracking-widest hover:bg-vy-white/10 hover:text-vy-white transition-all"
        >
          <Clock size={14} /> Upload Later
        </button>
      </div>

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
  const [fit, setFit]             = useState('Oversize'); // 'Oversize' or 'Regular'
  const [size, setSize]           = useState('M');
  const [color, setColor]         = useState('');
  const [position, setPosition]   = useState('Both');
  const [viewMode, setViewMode]   = useState('Front');
  const [description, setDescription] = useState('');
  const [designStatus, setDesignStatus] = useState('Firebase'); // 'Firebase', 'WhatsApp', 'Pending'

  // Live Custom Designer States
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [customText, setCustomText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(14);
  const [textFont, setTextFont] = useState('sans-serif');
  const [textRotation, setTextRotation] = useState(0);
  const [mockupColor, setMockupColor] = useState('#0A0A0A'); // maps to selected color

  const colorPresets = [
    { name: 'Pure Black', hex: '#0A0A0A' },
    { name: 'Vintage White', hex: '#F5F5F0' },
    { name: 'Charcoal Grey', hex: '#252526' },
    { name: 'Off-Cream', hex: '#F0EAD6' },
    { name: 'Cocoa Brown', hex: '#3d2314' },
    { name: 'Military Olive', hex: '#3b3f30' },
    { name: 'Deep Navy', hex: '#1d2b3a' },
    { name: 'Desert Sand', hex: '#C2B280' }
  ];

  const selectColorPreset = (preset) => {
    setColor(preset.name);
    setMockupColor(preset.hex);
  };

  if (user) window.userEmail = user.email;

  const [couponCode, setCouponCode]   = useState('');
  const [coupon, setCoupon]           = useState(null);
  const [discount, setDiscount]       = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [step, setStep] = useState(1); // 1: Fit, 2: Design, 3: Review
  const { addItem } = useCart();
  const [settings, setSettings] = useState(() => {
    const cached = localStorage.getItem('vy_customize_settings');
    return cached ? JSON.parse(cached) : null;
  });
  const [sizes, setSizes]   = useState(() => {
    const cached = localStorage.getItem('vy_customize_settings');
    return cached ? JSON.parse(cached).sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  });
  const [settingsLoading, setSettingsLoading] = useState(() => {
    return !localStorage.getItem('vy_customize_settings');
  });

  useEffect(() => {
    getCustomizeSettings()
      .then(s => {
        if (s) setSettings(s);
        if (s && s.sizes) setSizes(s.sizes);
      })
      .catch(err => {
        console.error('Failed to load studio settings:', err);
      })
      .finally(() => {
        setSettingsLoading(false);
      });
  }, []);

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-vy-black flex items-center justify-center">
        <Loader2 className="animate-spin text-vy-accent" size={32} />
      </div>
    );
  }

  const safeOversize = settings?.oversizePrices || { Front: 700, Back: 700, Both: 900 };
  const safeRegular  = settings?.regularPrices  || { Front: 600, Back: 600, Both: 800 };
  const safeSizes    = settings?.sizes          || sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const getMinPrice = (pricesObj, fallback) => {
    const vals = Object.values(pricesObj || {}).filter(v => typeof v === 'number' && v > 0);
    return vals.length > 0 ? Math.min(...vals) : fallback;
  };

  const basePrice     = fit === 'Oversize' ? (safeOversize[position] || 700) : (safeRegular[position] || 600);
  const finalPrice    = Math.max(0, basePrice - discount);

  const handlePositionChange = (pos) => {
    setPosition(pos);
    if (pos === 'Back') setViewMode('Back');
    if (pos === 'Front') setViewMode('Front');
  };

  // ── File handling ──────────────────────────────────
  const handleFiles = async (selectedFiles) => {
    if (selectedFiles === 'LATER') {
      setDesignStatus('Pending');
      setFiles([]);
      setPreviews([]);
      setImageUrls([]);
      toast.success('Design status set to "Upload Later". Proceed to review.', { className: 'toast-vybera' });
      return;
    }

    setDesignStatus('Firebase');
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
      // Parallel compression & upload
      const urls = await Promise.all(
        toAdd.map(async (f) => {
          const compressed = await imageCompression(f, compressionOptions);
          return uploadCustomDesign(compressed, user.uid, (p) => setUploadPct(p));
        })
      );
      setImageUrls(prev => [...prev, ...urls]);
    } catch (err) {
      console.error(err);
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
      const result = await validateCoupon(couponCode.trim().toUpperCase(), basePrice, user?.uid);
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
    if (files.length === 0 && designStatus === 'Firebase') {
      toast.error('Please upload your design or select "Upload Later".', { className: 'toast-vybera' });
      return;
    }
    if (!color.trim()) {
      toast.error('Please enter a t-shirt color.', { className: 'toast-vybera' });
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
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Add to Cart ─────────────────────────────────────
  const handleAddToCart = () => {
    setAddingToCart(true);
    
    const customItem = {
      id: `custom_${Date.now()}`,
      name: `${fit} Custom Tee (${position} Print)`,
      price: basePrice,
      size,
      color,
      fit,
      position,
      imageUrls,
      description: description.trim(),
      designStatus,
      image: imageUrls[0] || null, // First image as thumbnail
      isCustom: true,
      customizationParams: {
        color,
        scale,
        rotation,
        posX,
        posY,
        customText,
        textColor,
        textSize,
        textFont,
        textRotation
      }
    };

    addItem(customItem, size, 1, true);
    setAddingToCart(false);
    
    // Suggest navigating to cart
    toast((t) => (
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-vy-white">Added to your bag!</span>
        <button 
          onClick={() => { navigate('/cart'); toast.dismiss(t.id); }}
          className="bg-vy-white text-vy-black px-3 py-1.5 text-[10px] uppercase font-bold tracking-widest"
        >
          View Bag
        </button>
      </div>
    ), { duration: 6000, position: 'bottom-center', style: { background: '#141414', border: '1px solid #222' } });

    navigate('/cart');
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
        <div className="mb-6">
          <BackButton />
        </div>
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
        <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          <StepLabel n={1} label="Fit" active={step === 1} done={step > 1} />
          <div className={`flex-1 min-w-4 h-px transition-colors duration-500 ${step > 1 ? 'bg-vy-white' : 'bg-vy-border'}`} />
          <StepLabel n={2} label="Design" active={step === 2} done={step > 2} />
          <div className={`flex-1 min-w-4 h-px transition-colors duration-500 ${step > 2 ? 'bg-vy-white' : 'bg-vy-border'}`} />
          <StepLabel n={3} label="Review" active={step === 3} done={addingToCart} />
        </div>

        {/* Payment processing overlay */}
        <AnimatePresence>
          {addingToCart && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-vy-black/90 flex items-center justify-center flex-col gap-5"
            >
              <Loader2 size={48} className="text-vy-white animate-spin" />
              <p className="text-vy-white font-semibold tracking-wider">Adding to your bag…</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Fit Selection ────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { 
                    id: 'Oversize', 
                    title: 'Oversized Fit', 
                    desc: 'Drop shoulder, loose boxy fit, premium heavy-weight fabric.',
                    price: `Starting ₹${getMinPrice(safeOversize, 700)}`
                  },
                  { 
                    id: 'Regular', 
                    title: 'Regular Fit', 
                    desc: 'Standard comfort fit, classic silhouette, mid-weight cotton.',
                    price: `Starting ₹${getMinPrice(safeRegular, 600)}`
                  },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setFit(item.id); setStep(2); }}
                    className={`p-8 border text-left transition-all duration-500 group relative overflow-hidden ${
                      fit === item.id 
                        ? 'border-vy-white bg-vy-white/5' 
                        : 'border-vy-border hover:border-vy-grey bg-vy-card/30'
                    }`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <Shirt size={32} className={fit === item.id ? 'text-vy-accent' : 'text-vy-grey group-hover:text-vy-white'} />
                        <span className="text-[10px] tracking-widest uppercase font-bold text-vy-border">{item.price}</span>
                      </div>
                      <h3 className="text-vy-white text-xl font-bold tracking-wider mb-2 uppercase">{item.title}</h3>
                      <p className="text-vy-grey text-xs leading-relaxed max-w-[200px]">{item.desc}</p>
                      
                      <div className={`mt-8 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                        fit === item.id ? 'text-vy-accent translate-x-2' : 'text-vy-grey group-hover:text-vy-white translate-x-0'
                      }`}>
                        Select Fit <ChevronRight size={12} />
                      </div>
                    </div>
                    {/* Visual hint */}
                    <div className={`absolute -right-8 -bottom-8 opacity-[0.03] transition-transform duration-700 group-hover:scale-110 ${fit === item.id ? 'scale-110' : 'scale-100'}`}>
                      <Shirt size={200} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Design Options ────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto"
            >
              {/* Left Column: Visualizer (lg:col-span-5) */}
              <div className="lg:col-span-5 bg-vy-card border border-vy-border p-6 flex flex-col items-center justify-center relative min-h-[450px] lg:sticky lg:top-24">
                <span className="text-vy-grey text-[9px] tracking-widest uppercase font-bold absolute top-4 left-4">Live Preview</span>
                <span className="text-vy-accent text-[9px] tracking-widest uppercase font-bold absolute top-4 right-4">{viewMode} View</span>
                
                {/* T-Shirt Canvas container */}
                <div className="relative w-80 h-96 flex items-center justify-center overflow-hidden">
                  <ShirtOutline color={mockupColor} />

                  {/* Printable Area bounding box */}
                  <div className="absolute top-[26%] left-[30%] w-[40%] h-[46%] border border-dashed border-vy-white/20 flex items-center justify-center overflow-hidden z-10">
                    {/* Design image layer */}
                    {previews.length > 0 && previews[0] !== 'LATER' && (
                      <img
                        src={previews[0]}
                        alt="Design layer"
                        className="pointer-events-none select-none max-w-full max-h-full object-contain"
                        style={{
                          transform: `translate(${posX}px, ${posY}px) scale(${scale}) rotate(${rotation}deg)`,
                          transition: 'transform 0.1s ease-out'
                        }}
                      />
                    )}

                    {/* Custom text layer */}
                    {customText && (
                      <div
                        className="absolute pointer-events-none select-none text-center font-bold"
                        style={{
                          color: textColor,
                          fontSize: `${textSize}px`,
                          fontFamily: textFont,
                          transform: `rotate(${textRotation}deg)`,
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}
                      >
                        {customText}
                      </div>
                    )}

                    {previews.length === 0 && !customText && (
                      <span className="text-vy-grey/30 text-[9px] uppercase tracking-widest font-bold">Print Area</span>
                    )}
                  </div>
                </div>

                {/* Print side selector (Front/Back) */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setViewMode('Front')}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider border ${
                      viewMode === 'Front' ? 'border-vy-white bg-vy-white/10 text-vy-white' : 'border-vy-border text-vy-grey hover:text-vy-white'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    onClick={() => setViewMode('Back')}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider border ${
                      viewMode === 'Back' ? 'border-vy-white bg-vy-white/10 text-vy-white' : 'border-vy-border text-vy-grey hover:text-vy-white'
                    }`}
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Right Column: Customizer Controls (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-8 bg-vy-card border border-vy-border p-6">
                {/* Fit summary */}
                <div className="flex items-center justify-between p-4 border border-vy-border bg-vy-black/40">
                  <div className="flex items-center gap-3">
                    <Shirt size={18} className="text-vy-accent" />
                    <div>
                      <p className="text-vy-grey text-[10px] tracking-widest uppercase font-bold">Selected Fit</p>
                      <p className="text-vy-white text-xs font-bold uppercase">{fit} Fit</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep(1)}
                    className="text-vy-grey text-[10px] tracking-widest uppercase hover:text-vy-white transition-colors"
                  >
                    Change Fit
                  </button>
                </div>

                {/* 1. Color Presets */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-3">T-Shirt Color</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {colorPresets.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => selectColorPreset(preset)}
                        className={`w-6 h-6 rounded-full border transition-transform flex-shrink-0 ${
                          color === preset.name ? 'border-vy-white scale-110 shadow-lg' : 'border-vy-border/40 hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="vy-input w-full text-xs"
                    placeholder="Or enter custom color (e.g. Acid Wash Grey)"
                    maxLength={30}
                  />
                </div>

                {/* 2. Upload Zone */}
                <UploadZone
                  files={files}
                  previews={previews}
                  onFiles={handleFiles}
                  onRemove={removeFile}
                  uploading={uploading}
                  progress={uploadPct}
                />

                {/* 3. Image Layout Parameters */}
                {previews.length > 0 && previews[0] !== 'LATER' && (
                  <div className="p-4 border border-vy-border bg-vy-black/40 space-y-4">
                    <h4 className="text-vy-white text-[10px] uppercase tracking-widest font-bold border-l-2 border-vy-accent pl-2">Image Adjustments</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Scale */}
                      <div>
                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-vy-grey mb-1">
                          <span>Scale</span>
                          <span>{Math.round(scale * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="2.0"
                          step="0.05"
                          value={scale}
                          onChange={e => setScale(parseFloat(e.target.value))}
                          className="w-full accent-vy-accent bg-vy-dark"
                        />
                      </div>

                      {/* Rotation */}
                      <div>
                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-vy-grey mb-1">
                          <span>Rotation</span>
                          <span>{rotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={rotation}
                          onChange={e => setRotation(parseInt(e.target.value))}
                          className="w-full accent-vy-accent bg-vy-dark"
                        />
                      </div>

                      {/* X Offset */}
                      <div>
                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-vy-grey mb-1">
                          <span>Horizontal</span>
                          <span>{posX}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={posX}
                          onChange={e => setPosX(parseInt(e.target.value))}
                          className="w-full accent-vy-accent bg-vy-dark"
                        />
                      </div>

                      {/* Y Offset */}
                      <div>
                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-vy-grey mb-1">
                          <span>Vertical</span>
                          <span>{posY}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={posY}
                          onChange={e => setPosY(parseInt(e.target.value))}
                          className="w-full accent-vy-accent bg-vy-dark"
                        />
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <button
                        onClick={() => { setScale(1.0); setRotation(0); setPosX(0); setPosY(0); }}
                        className="text-[9px] uppercase tracking-widest text-vy-grey hover:text-vy-white"
                      >
                        Reset Layout
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Text Customizer Layer */}
                <div className="p-4 border border-vy-border bg-vy-black/40 space-y-4">
                  <h4 className="text-vy-white text-[10px] uppercase tracking-widest font-bold border-l-2 border-vy-accent pl-2">Slogan / Text Layer</h4>
                  
                  <div>
                    <label className="text-vy-grey text-[9px] uppercase tracking-widest block mb-1">Custom Text</label>
                    <input
                      type="text"
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      placeholder="Type custom text (e.g. OVERSIZED)"
                      className="vy-input text-xs"
                      maxLength={50}
                    />
                  </div>

                  {customText && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Text Color */}
                      <div>
                        <label className="text-vy-grey text-[9px] uppercase tracking-widest block mb-1.5">Text Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={textColor}
                            onChange={e => setTextColor(e.target.value)}
                            className="w-8 h-8 bg-transparent border-0 cursor-pointer flex-shrink-0"
                          />
                          <input
                            type="text"
                            value={textColor}
                            onChange={e => setTextColor(e.target.value)}
                            className="vy-input text-[10px]"
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>

                      {/* Font Family */}
                      <div>
                        <label className="text-vy-grey text-[9px] uppercase tracking-widest block mb-1.5">Font Style</label>
                        <select
                          value={textFont}
                          onChange={e => setTextFont(e.target.value)}
                          className="vy-input text-xs"
                        >
                          <option value="sans-serif">Modern Sans</option>
                          <option value="serif">Classic Serif</option>
                          <option value="monospace">Digital Mono</option>
                          <option value="'Outfit', sans-serif">Outfit Display</option>
                          <option value="cursive">Street Cursive</option>
                        </select>
                      </div>

                      {/* Text Size */}
                      <div>
                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-vy-grey mb-1">
                          <span>Text Size</span>
                          <span>{textSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="32"
                          value={textSize}
                          onChange={e => setTextSize(parseInt(e.target.value))}
                          className="w-full accent-vy-accent bg-vy-dark"
                        />
                      </div>

                      {/* Text Rotation */}
                      <div>
                        <div className="flex justify-between text-[9px] uppercase tracking-widest text-vy-grey mb-1">
                          <span>Text Rotation</span>
                          <span>{textRotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={textRotation}
                          onChange={e => setTextRotation(parseInt(e.target.value))}
                          className="w-full accent-vy-accent bg-vy-dark"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Size Selection */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-3">Size</label>
                  <div className="flex gap-2">
                    {safeSizes.map(s => (
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

                {/* 6. Print Position */}
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
                          ₹{(fit === 'Oversize' ? (safeOversize[pos] || 0) : (safeRegular[pos] || 0)).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-vy-white text-[13px] mt-4 block p-3 border border-vy-white/10 bg-vy-white/5">
                    <strong>Note:</strong> If your print design is small, we will automatically refund the price difference.
                  </p>
                </div>

                {/* 7. Description */}
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
            </motion.div>
          )}

          {/* ── Step 3: Review & Pay ──────────────────────── */}
          {step === 3 && (
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
                      onClick={() => setStep(2)}
                      className="text-vy-grey text-xs tracking-widest uppercase hover:text-vy-white transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex gap-4">
                    {previews.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {previews.map((p, i) => (
                          <img key={i} src={p} alt="Design" className="w-16 h-16 object-contain bg-vy-dark border border-vy-border" />
                        ))}
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-vy-dark border border-vy-border flex flex-col items-center justify-center text-vy-grey">
                        {designStatus === 'WhatsApp' ? <MessageCircle size={20} /> : <Clock size={20} />}
                        <span className="text-[8px] mt-1 uppercase font-bold">{designStatus}</span>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      {[
                        ['Fit', fit],
                        ['Size', size],
                        ['Color', color],
                        ['Print Position', position],
                        ['Design Status', designStatus === 'Firebase' ? 'Uploaded' : designStatus],
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

                {/* Total Info */}
                <div className="bg-vy-card border border-vy-border p-6">
                  <h2 className="text-vy-white text-sm font-semibold tracking-widest uppercase mb-4">Total for this design</h2>
                  <div className="flex items-baseline justify-between mb-4">
                    <span className="text-vy-grey text-sm">Estimated Price</span>
                    <span className="text-vy-white font-bold text-2xl">₹{basePrice.toLocaleString()}</span>
                  </div>
                  <p className="text-vy-grey text-[10px] leading-relaxed italic">
                    Note: Coupons can be applied globally in your shopping bag.
                  </p>
                </div>
              </div>

              {/* Right: Add to Cart */}
              <div className="h-fit lg:sticky lg:top-24">
                <div className="bg-vy-card border border-vy-border p-6 space-y-4 shadow-2xl">
                  <h2 className="text-vy-white font-semibold tracking-widest uppercase text-sm">Review & Add</h2>

                  {/* Summary */}
                  <div className="space-y-3 pb-4 border-b border-vy-border text-xs">
                    <div className="flex justify-between">
                      <span className="text-vy-grey">Position</span>
                      <span className="text-vy-white">{position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vy-grey">Fit</span>
                      <span className="text-vy-white">{fit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-vy-grey">T-Shirt Color</span>
                      <span className="text-vy-white">{color}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-vy-white">Price</span>
                      <span className="text-vy-white">₹{basePrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 border border-red-500/20 bg-red-500/5 text-[10px] text-red-400 space-y-1">
                    <p className="font-semibold tracking-widest uppercase">⚠️ Strict No Return Policy</p>
                    <p className="text-vy-grey/80">Custom items are made uniquely for you and cannot be returned or replaced.</p>
                  </div>

                  <motion.button
                    onClick={handleAddToCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-xs font-bold"
                  >
                    <Shirt size={16} />
                    ADD TO BAG — ₹{basePrice.toLocaleString()}
                  </motion.button>

                  <p className="text-vy-grey text-[10px] text-center leading-relaxed opacity-60">
                    You can combine this with regular items in your bag and apply a single coupon at checkout.
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
