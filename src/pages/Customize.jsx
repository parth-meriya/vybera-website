import { useState, useEffect, useRef, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Upload, X, Check, CheckCircle, AlertCircle, Loader2,
  Shirt, ChevronRight, Image as ImageIcon, MessageCircle, Clock, Users,
  Palette, Sliders, Type, RotateCw, ZoomIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { uploadCustomDesign } from '../firebase/customOrders';
import { getCustomizeSettings } from '../firebase/content';
import { validateCoupon } from '../firebase/coupons';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';
import BackButton from '../components/ui/BackButton';

const POSITIONS = ['Front', 'Back', 'Both'];

const DEFAULT_COLOR_PRESETS = [
  { name: 'Pure Black', hex: '#0A0A0A' },
  { name: 'Vintage White', hex: '#F5F5F0' },
  { name: 'Charcoal Grey', hex: '#252526' },
  { name: 'Off-Cream', hex: '#F0EAD6' },
  { name: 'Cocoa Brown', hex: '#3D2314' },
  { name: 'Military Olive', hex: '#3B3F30' },
  { name: 'Deep Navy', hex: '#1D2B3A' },
  { name: 'Desert Sand', hex: '#C2B280' },
  { name: 'Crimson Burgundy', hex: '#590907' },
];

// Helper to determine if a hex color is light or dark for optimal stroke contrast
const isLightColor = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return false;
  const r = parseInt(cleanHex.length === 3 ? cleanHex[0] + cleanHex[0] : cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.length === 3 ? cleanHex[1] + cleanHex[1] : cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.length === 3 ? cleanHex[2] + cleanHex[2] : cleanHex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

const ShirtOutline = ({ color = '#0A0A0A' }) => {
  const isLight = isLightColor(color);
  const outlineStroke = isLight ? '#75665C' : '#555555';
  const seamStroke = isLight ? '#A5A79B' : '#333333';

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl" style={{ transition: 'all 0.3s ease' }}>
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
        stroke={outlineStroke}
        strokeWidth="1.2"
      />
      {/* Collar detail */}
      <path
        d="M 32,15 C 37,20 43,20 50,22 C 57,20 63,20 68,15"
        fill="none"
        stroke={outlineStroke}
        strokeWidth="1.5"
      />
      {/* Left sleeve seam */}
      <path
        d="M 30,32 L 20,20"
        fill="none"
        stroke={seamStroke}
        strokeWidth="0.8"
      />
      {/* Right sleeve seam */}
      <path
        d="M 70,32 L 80,20"
        fill="none"
        stroke={seamStroke}
        strokeWidth="0.8"
      />
    </svg>
  );
};

// ── Image Compression Settings ──────────────────────────
const compressionOptions = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1000,
  useWebWorker: true,
  fileType: 'image/webp'
};

// ── Sub-components ──────────────────────────────────────
const StepLabel = ({ n, label, active, done }) => (
  <div className={`flex items-center gap-2.5 ${done ? 'text-[#590907]' : active ? 'text-[#30231F]' : 'text-[#75665C]'}`}>
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-300 ${
      done ? 'bg-[#590907] border-[#590907] text-white shadow-sm' :
      active ? 'border-[#590907] text-[#590907] bg-[#590907]/10 font-black ring-2 ring-[#590907]/20' :
      'border-[#D4BEA5] text-[#75665C] bg-white'
    }`}>
      {done ? '✓' : n}
    </div>
    <span className={`text-xs tracking-widest uppercase font-bold hidden sm:block ${active ? 'text-[#30231F]' : done ? 'text-[#590907]' : 'text-[#75665C]'}`}>
      {label}
    </span>
  </div>
);

// ── Upload Zone ─────────────────────────────────────────
const UploadZone = ({ files, previews, onFiles, onRemove, uploading, progress }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const processFiles = (fileList) => {
    const valid = Array.from(fileList).filter(f => {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(f.type)) {
        toast.error(`${f.name} is not JPG/PNG/WebP.`, { className: 'toast-vybera' });
        return false;
      }
      if (f.size > 15 * 1024 * 1024) {
        toast.error(`${f.name} is over 15MB.`, { className: 'toast-vybera' });
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
      <div className="flex items-center justify-between mb-2">
        <label className="text-[#30231F] text-xs tracking-wider uppercase font-bold block">
          Upload Your Designs ({files.length}/3) *
        </label>
        <span className="text-[10px] text-[#75665C] uppercase tracking-wider font-semibold">High Res PNG / JPG</span>
      </div>

      {files.length < 3 && (
        <motion.div
          className={`border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 p-8 cursor-pointer mb-4 rounded-sm ${
            dragging ? 'border-[#590907] bg-[#590907]/5' : 'border-[#D4BEA5] bg-[#FAF5ED] hover:border-[#590907] hover:bg-white'
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <div className="w-12 h-12 rounded-full bg-[#E8D2B5] flex items-center justify-center text-[#590907]">
            <Upload size={24} />
          </div>
          <div className="text-center">
            <p className="text-[#30231F] text-sm font-bold tracking-wide">Drag & drop or click to upload</p>
            <p className="text-[#75665C] text-xs mt-1">Supports transparent PNG, high-res JPG — max 15MB</p>
          </div>
        </motion.div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {previews.map((prev, idx) => (
            <div key={idx} className="relative border border-[#D4BEA5] bg-[#FAF5ED] p-2 group shadow-sm">
              <img src={prev} alt={`Preview ${idx + 1}`} className="w-full h-28 object-contain bg-white border border-[#D4BEA5]/40" />
              
              {/* Upload progress overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-[#30231F]/80 flex flex-col items-center justify-center">
                  <Loader2 size={18} className="text-white animate-spin mb-1" />
                  <p className="text-[#FAF5ED] text-[10px] font-bold">{progress}%</p>
                </div>
              )}

              {!uploading && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-[#30231F] text-white hover:bg-[#590907] transition-all rounded-full shadow-md"
                  title="Remove image"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => {
            const msg = `Hi VYBERA, I want to order a custom t-shirt. My email is ${encodeURIComponent(window.userEmail || '')}. I will send my design here.`;
            window.open(`https://wa.me/917574097366?text=${encodeURIComponent(msg)}`, '_blank');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] uppercase font-bold tracking-wider hover:bg-emerald-100 transition-all shadow-xs"
        >
          <MessageCircle size={14} className="text-emerald-600" /> Submit via WhatsApp
        </button>
        <button
          type="button"
          onClick={() => onFiles('LATER')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D4BEA5] text-[#30231F] text-[11px] uppercase font-bold tracking-wider hover:bg-[#FAF5ED] hover:border-[#590907] transition-all shadow-xs"
        >
          <Clock size={14} className="text-[#75665C]" /> Upload Design Later
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => processFiles(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

const Customize = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkQty, setBulkQty] = useState('25');
  const [bulkOrg, setBulkOrg] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');

  // Form state
  const [files, setFiles]         = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [fit, setFit]             = useState('Oversize'); // 'Oversize' or 'Regular'
  const [size, setSize]           = useState('M');
  const [color, setColor]         = useState('Pure Black');
  const [mockupColor, setMockupColor] = useState('#0A0A0A');
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
  const [textColor, setTextColor] = useState('#FAF5ED');
  const [textSize, setTextSize] = useState(14);
  const [textFont, setTextFont] = useState('sans-serif');
  const [textRotation, setTextRotation] = useState(0);

  const [colorPresets, setColorPresets] = useState(DEFAULT_COLOR_PRESETS);

  // Dynamic T-shirt color updater with color parsing
  const updateTShirtColor = (name, hex = null) => {
    setColor(name);
    if (hex) {
      setMockupColor(hex);
      return;
    }

    // Match preset
    const match = colorPresets.find(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (match) {
      setMockupColor(match.hex);
      return;
    }

    // Check hex
    if (/^#([0-9A-F]{3}){1,2}$/i.test(name.trim())) {
      setMockupColor(name.trim());
      return;
    }

    // Common color names lookup
    const nameMap = {
      white: '#FFFFFF',
      black: '#0A0A0A',
      cream: '#FAF5ED',
      beige: '#E8D2B5',
      burgundy: '#590907',
      maroon: '#590907',
      navy: '#1D2B3A',
      blue: '#2563EB',
      red: '#DC2626',
      green: '#16A34A',
      olive: '#3B3F30',
      grey: '#75665C',
      gray: '#75665C',
      charcoal: '#252526',
      brown: '#3D2314',
      sand: '#C2B280',
      yellow: '#FACC15',
      purple: '#7E22CE',
      pink: '#EC4899',
      orange: '#EA580C',
    };
    const lookup = name.trim().toLowerCase();
    if (nameMap[lookup]) {
      setMockupColor(nameMap[lookup]);
    }
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
        if (s) {
          setSettings(s);
          if (s.colors && Array.isArray(s.colors) && s.colors.length > 0) {
            setColorPresets(s.colors);
          }
          if (s.sizes && Array.isArray(s.sizes) && s.sizes.length > 0) {
            setSizes(s.sizes);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load studio settings:', err);
      })
      .finally(() => {
        setSettingsLoading(false);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fitParam = params.get('fit');
    if (fitParam) {
      if (fitParam.toLowerCase().includes('over')) {
        setFit('Oversize');
        setStep(2);
      } else if (fitParam.toLowerCase().includes('reg')) {
        setFit('Regular');
        setStep(2);
      }
    }
    const tabParam = params.get('tab');
    if (tabParam === 'bulk') {
      setShowBulkModal(true);
    }
  }, [location.search]);

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-[#FAF5ED] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#590907]" size={36} />
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
    } catch (err) {
      setCouponError('Failed to apply coupon');
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
      toast.error('Please select or enter a t-shirt color.', { className: 'toast-vybera' });
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
      image: imageUrls[0] || null,
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
    
    toast.success('Custom design added to your bag!', { className: 'toast-vybera' });
    navigate('/cart');
  };

  // ── Render ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#30231F] pt-24 pb-16">
      <SEO
        title="Custom T-Shirt Studio | VYBERA"
        description="Design your own custom premium oversized tee. Upload artwork, choose placements, and customize colors on 240+ GSM heavyweight cotton."
        keywords="custom t-shirts India, design your own tee, custom oversized t-shirt, custom streetwear, print on demand streetwear"
        path="/customize"
      />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-[#590907] mb-1 font-bold text-xs uppercase tracking-[0.25em]">
            <Palette size={14} />
            <span>BESPOKE PRINT STUDIO</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl md:text-5xl tracking-tight uppercase text-[#30231F] mb-3">
            CUSTOMIZE YOUR FIT
          </h1>
          <p className="text-[#75665C] text-xs sm:text-sm max-w-2xl leading-relaxed">
            Upload your artwork, pick your t-shirt color, position prints, and preview in real time on our luxury 240+ GSM heavyweight streetwear blank.
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-2 no-scrollbar border-b border-[#D4BEA5]/60 pt-2">
          <StepLabel n={1} label="Choose Fit" active={step === 1} done={step > 1} />
          <div className={`flex-1 min-w-6 h-0.5 transition-colors duration-500 ${step > 1 ? 'bg-[#590907]' : 'bg-[#D4BEA5]'}`} />
          <StepLabel n={2} label="Design & Color" active={step === 2} done={step > 2} />
          <div className={`flex-1 min-w-6 h-0.5 transition-colors duration-500 ${step > 2 ? 'bg-[#590907]' : 'bg-[#D4BEA5]'}`} />
          <StepLabel n={3} label="Review & Bag" active={step === 3} done={addingToCart} />
        </div>

        {/* Processing overlay */}
        <AnimatePresence>
          {addingToCart && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#30231F]/90 flex items-center justify-center flex-col gap-4 text-white"
            >
              <Loader2 size={44} className="text-[#FAF5ED] animate-spin" />
              <p className="text-[#FAF5ED] font-bold text-sm tracking-wider uppercase">Adding to your bag…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bulk / Group Order Modal ─────────────────── */}
        <AnimatePresence>
          {showBulkModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 16 }}
                className="bg-[#FAF5ED] w-full max-w-lg border border-[#D4BEA5] shadow-2xl p-6 sm:p-8 relative"
              >
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="absolute top-4 right-4 p-2 text-[#75665C] hover:text-[#590907] transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <span className="p-2.5 bg-[#590907] text-[#FAF5ED]">
                    <Users size={20} />
                  </span>
                  <div>
                    <h3 className="font-display font-black text-xl uppercase tracking-wider text-[#30231F]">
                      Bulk & Group Orders
                    </h3>
                    <p className="text-[10px] text-[#75665C] uppercase tracking-widest font-bold">
                      COLLEGES • STARTUPS • BRAND MERCH • FESTS
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#75665C] mb-6 leading-relaxed">
                  Get exclusive tier discounts, personalized fabric samples, screen/DTF/embroidery options, and dedicated priority production for orders over 20 pieces.
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#30231F] mb-1">
                      Organization / College / Brand Name
                    </label>
                    <input
                      type="text"
                      value={bulkOrg}
                      onChange={(e) => setBulkOrg(e.target.value)}
                      placeholder="e.g. IIT Bombay / Starlight Club"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D4BEA5] text-[#30231F] focus:border-[#590907] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#30231F] mb-1">
                        Estimated Quantity
                      </label>
                      <select
                        value={bulkQty}
                        onChange={(e) => setBulkQty(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D4BEA5] text-[#30231F] font-bold focus:border-[#590907] outline-none"
                      >
                        <option value="20-50">20 – 50 pcs (Tier 1)</option>
                        <option value="50-100">50 – 100 pcs (Tier 2)</option>
                        <option value="100-250">100 – 250 pcs (Tier 3)</option>
                        <option value="250+">250+ pcs (Enterprise)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#30231F] mb-1">
                        Preferred Fit
                      </label>
                      <select
                        value={fit}
                        onChange={(e) => setFit(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#D4BEA5] text-[#30231F] font-bold focus:border-[#590907] outline-none"
                      >
                        <option value="Oversize">Oversized Fit</option>
                        <option value="Regular">Regular Fit</option>
                        <option value="Mix">Mix of Both</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#30231F] mb-1">
                      Specific Requirements / Notes
                    </label>
                    <textarea
                      rows={2}
                      value={bulkNotes}
                      onChange={(e) => setBulkNotes(e.target.value)}
                      placeholder="e.g. Front chest embroidery + oversized back print, delivery by next month."
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D4BEA5] text-[#30231F] focus:border-[#590907] outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={`https://wa.me/917574097366?text=${encodeURIComponent(
                      `Hello VYBERA Team! I would like a quote for a Bulk Order:\n- Organization: ${bulkOrg || 'Not specified'}\n- Quantity: ${bulkQty} pieces\n- Preferred Fit: ${fit}\n- Requirements: ${bulkNotes || 'Standard custom print'}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-[#590907] hover:bg-[#430605] text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <MessageCircle size={16} />
                    Inquire Instantly on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkModal(false);
                      setStep(2);
                    }}
                    className="text-center text-[11px] font-bold text-[#75665C] hover:text-[#590907] uppercase tracking-wider py-2"
                  >
                    Or design single prototype in Studio &rarr;
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Fit Selection ────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="max-w-5xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { 
                    id: 'Oversize', 
                    title: 'Oversized Fit', 
                    desc: 'Drop shoulder, loose boxy streetwear fit, 240+ GSM heavyweight cotton.',
                    price: `Starting ₹${getMinPrice(safeOversize, 700)}`,
                    isBulk: false
                  },
                  { 
                    id: 'Regular', 
                    title: 'Regular Fit', 
                    desc: 'Standard comfort fit, classic silhouette, 100% combed cotton.',
                    price: `Starting ₹${getMinPrice(safeRegular, 600)}`,
                    isBulk: false
                  },
                  { 
                    id: 'Bulk', 
                    title: 'Bulk / Group Orders', 
                    desc: 'College fests, startup merch, team drops & wholesale tier discounts.',
                    price: 'Min 20+ pcs',
                    isBulk: true
                  },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.isBulk) {
                        setShowBulkModal(true);
                      } else {
                        setFit(item.id);
                        setStep(2);
                      }
                    }}
                    className={`p-6 border text-left transition-all duration-300 group relative overflow-hidden bg-white shadow-sm ${
                      !item.isBulk && fit === item.id 
                        ? 'border-[#590907] ring-2 ring-[#590907]/20' 
                        : 'border-[#D4BEA5] hover:border-[#590907]'
                    }`}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        {item.isBulk ? (
                          <div className="w-12 h-12 rounded-full bg-[#590907]/10 flex items-center justify-center text-[#590907]">
                            <Users size={24} />
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            fit === item.id ? 'bg-[#590907] text-white' : 'bg-[#F3E7D8] text-[#590907]'
                          }`}>
                            <Shirt size={24} />
                          </div>
                        )}
                        <span className="text-[10px] tracking-widest uppercase font-black text-[#590907] bg-[#F3E7D8] px-2.5 py-1">
                          {item.price}
                        </span>
                      </div>
                      <h3 className="text-[#30231F] text-lg font-black tracking-wider mb-2 uppercase">
                        {item.title}
                      </h3>
                      <p className="text-[#75665C] text-xs leading-relaxed">
                        {item.desc}
                      </p>
                      
                      <div className={`mt-6 flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 ${
                        item.isBulk ? 'text-[#590907]' : fit === item.id ? 'text-[#590907] translate-x-1' : 'text-[#75665C] group-hover:text-[#590907]'
                      }`}>
                        {item.isBulk ? 'Inquire Bulk' : 'Select This Fit'} <ChevronRight size={12} />
                      </div>
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
              <div className="lg:col-span-5 bg-white border border-[#D4BEA5] p-6 shadow-sm flex flex-col items-center justify-center relative min-h-[460px] lg:sticky lg:top-24">
                <span className="text-[#75665C] text-[10px] tracking-widest uppercase font-bold absolute top-4 left-4">
                  Interactive Preview
                </span>
                <span className="text-[#590907] text-[10px] tracking-widest uppercase font-black absolute top-4 right-4 bg-[#F3E7D8] px-2 py-0.5">
                  {viewMode} View
                </span>
                
                {/* T-Shirt Canvas container */}
                <div className="relative w-80 h-96 flex items-center justify-center overflow-hidden my-4 bg-[#FAF5ED] border border-[#D4BEA5]/60 p-4 shadow-inner">
                  <ShirtOutline color={mockupColor} />

                  {/* Printable Area bounding box */}
                  <div className="absolute top-[26%] left-[30%] w-[40%] h-[46%] border-2 border-dashed border-[#590907]/40 flex items-center justify-center overflow-hidden z-10 pointer-events-none">
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
                        className="absolute pointer-events-none select-none text-center font-black"
                        style={{
                          color: textColor,
                          fontSize: `${textSize}px`,
                          fontFamily: textFont,
                          transform: `rotate(${textRotation}deg)`,
                          textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                        }}
                      >
                        {customText}
                      </div>
                    )}

                    {previews.length === 0 && !customText && (
                      <span className="text-[#75665C]/60 text-[9px] uppercase tracking-widest font-bold">
                        Print Area
                      </span>
                    )}
                  </div>
                </div>

                {/* Print side selector (Front/Back) */}
                <div className="flex items-center gap-2 mt-2 w-full max-w-xs justify-center">
                  <button
                    type="button"
                    onClick={() => setViewMode('Front')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                      viewMode === 'Front'
                        ? 'bg-[#590907] text-white border-[#590907] shadow-sm'
                        : 'bg-white border-[#D4BEA5] text-[#30231F] hover:border-[#590907]'
                    }`}
                  >
                    Front View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('Back')}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all ${
                      viewMode === 'Back'
                        ? 'bg-[#590907] text-white border-[#590907] shadow-sm'
                        : 'bg-white border-[#D4BEA5] text-[#30231F] hover:border-[#590907]'
                    }`}
                  >
                    Back View
                  </button>
                </div>

                <p className="text-[10px] text-[#75665C] text-center mt-3 uppercase tracking-wider font-semibold">
                  Preview Color: <span className="text-[#590907] font-bold">{color}</span>
                </p>
              </div>

              {/* Right Column: Customizer Controls (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-6 bg-white border border-[#D4BEA5] p-6 md:p-8 shadow-sm">
                
                {/* Fit summary header */}
                <div className="flex items-center justify-between p-3.5 border border-[#D4BEA5] bg-[#F3E7D8]/60">
                  <div className="flex items-center gap-3">
                    <Shirt size={20} className="text-[#590907]" />
                    <div>
                      <p className="text-[#75665C] text-[10px] tracking-widest uppercase font-bold">Chosen Silhouette</p>
                      <p className="text-[#30231F] text-xs font-black uppercase">{fit} Heavyweight Fit</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[#590907] text-[10px] font-bold tracking-widest uppercase underline hover:text-[#430605] transition-colors"
                  >
                    Change Fit
                  </button>
                </div>

                {/* 1. T-Shirt Color Selection System */}
                <div className="p-4 bg-[#FAF5ED] border border-[#D4BEA5]">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[#30231F] text-xs tracking-wider uppercase font-black flex items-center gap-2">
                      <Palette size={15} className="text-[#590907]" />
                      T-Shirt Color: <span className="text-[#590907]">{color || 'Custom'}</span>
                    </label>
                    <span className="text-[10px] text-[#75665C] font-semibold uppercase">
                      Select or type custom
                    </span>
                  </div>

                  {/* Swatches Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3.5">
                    {colorPresets.map(preset => {
                      const isSelected = color.toLowerCase() === preset.name.toLowerCase();
                      const isLight = isLightColor(preset.hex);
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => updateTShirtColor(preset.name, preset.hex)}
                          className={`flex items-center gap-2 p-2 border transition-all text-left ${
                            isSelected
                              ? 'border-[#590907] bg-white ring-2 ring-[#590907]/20 shadow-xs'
                              : 'border-[#D4BEA5]/80 bg-white/70 hover:border-[#590907] hover:bg-white'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border ${
                              isLight ? 'border-[#D4BEA5]' : 'border-black/30'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                          >
                            {isSelected && (
                              <Check size={11} className={isLight ? 'text-[#30231F]' : 'text-white'} />
                            )}
                          </span>
                          <span className="text-[11px] font-bold text-[#30231F] truncate">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Color Input & Hex Picker */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center">
                      <input
                        type="color"
                        value={mockupColor.startsWith('#') && mockupColor.length === 7 ? mockupColor : '#0A0A0A'}
                        onChange={(e) => updateTShirtColor(e.target.value, e.target.value)}
                        className="w-9 h-9 p-0.5 border border-[#D4BEA5] bg-white cursor-pointer rounded-xs"
                        title="Pick custom color from palette"
                      />
                    </div>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => updateTShirtColor(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-[#D4BEA5] text-[#30231F] font-semibold focus:border-[#590907] outline-none"
                      placeholder="Or enter custom shade (e.g. Acid Wash Grey, #241916)"
                      maxLength={35}
                    />
                  </div>
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
                  <div className="p-4 border border-[#D4BEA5] bg-[#FAF5ED] space-y-3.5">
                    <div className="flex items-center justify-between border-b border-[#D4BEA5]/70 pb-2">
                      <h4 className="text-[#30231F] text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                        <Sliders size={14} className="text-[#590907]" /> Image Layout & Scaling
                      </h4>
                      <button
                        type="button"
                        onClick={() => { setScale(1.0); setRotation(0); setPosX(0); setPosY(0); }}
                        className="text-[10px] uppercase tracking-wider font-bold text-[#590907] hover:underline"
                      >
                        Reset Layout
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Scale */}
                      <div>
                        <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-[#75665C] mb-1">
                          <span>Scale</span>
                          <span className="text-[#30231F]">{Math.round(scale * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.2"
                          max="2.0"
                          step="0.05"
                          value={scale}
                          onChange={e => setScale(parseFloat(e.target.value))}
                          className="w-full accent-[#590907] cursor-pointer"
                        />
                      </div>

                      {/* Rotation */}
                      <div>
                        <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-[#75665C] mb-1">
                          <span>Rotation</span>
                          <span className="text-[#30231F]">{rotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={rotation}
                          onChange={e => setRotation(parseInt(e.target.value))}
                          className="w-full accent-[#590907] cursor-pointer"
                        />
                      </div>

                      {/* X Offset */}
                      <div>
                        <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-[#75665C] mb-1">
                          <span>Horizontal Position</span>
                          <span className="text-[#30231F]">{posX}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={posX}
                          onChange={e => setPosX(parseInt(e.target.value))}
                          className="w-full accent-[#590907] cursor-pointer"
                        />
                      </div>

                      {/* Y Offset */}
                      <div>
                        <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-[#75665C] mb-1">
                          <span>Vertical Position</span>
                          <span className="text-[#30231F]">{posY}px</span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={posY}
                          onChange={e => setPosY(parseInt(e.target.value))}
                          className="w-full accent-[#590907] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Text Customizer Layer */}
                <div className="p-4 border border-[#D4BEA5] bg-[#FAF5ED] space-y-3.5">
                  <h4 className="text-[#30231F] text-xs uppercase tracking-wider font-bold flex items-center gap-2 border-b border-[#D4BEA5]/70 pb-2">
                    <Type size={14} className="text-[#590907]" /> Add Text / Slogan Layer (Optional)
                  </h4>
                  
                  <div>
                    <label className="text-[#75665C] text-[10px] uppercase tracking-wider font-bold block mb-1">
                      Custom Text
                    </label>
                    <input
                      type="text"
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      placeholder="Type custom text (e.g. OVERSIZED, 1998, VYBERA)"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D4BEA5] text-[#30231F] font-semibold focus:border-[#590907] outline-none"
                      maxLength={50}
                    />
                  </div>

                  {customText && (
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      {/* Text Color */}
                      <div>
                        <label className="text-[#75665C] text-[10px] uppercase tracking-wider font-bold block mb-1">
                          Text Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={textColor}
                            onChange={e => setTextColor(e.target.value)}
                            className="w-8 h-8 p-0.5 border border-[#D4BEA5] bg-white cursor-pointer rounded-xs"
                          />
                          <input
                            type="text"
                            value={textColor}
                            onChange={e => setTextColor(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#D4BEA5] text-[#30231F] font-mono focus:border-[#590907] outline-none"
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>

                      {/* Font Family */}
                      <div>
                        <label className="text-[#75665C] text-[10px] uppercase tracking-wider font-bold block mb-1">
                          Font Style
                        </label>
                        <select
                          value={textFont}
                          onChange={e => setTextFont(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D4BEA5] text-[#30231F] font-bold focus:border-[#590907] outline-none"
                        >
                          <option value="sans-serif">Modern Sans</option>
                          <option value="serif">Classic Serif</option>
                          <option value="monospace">Digital Mono</option>
                          <option value="'Outfit', sans-serif">Outfit Streetwear</option>
                          <option value="cursive">Urban Cursive</option>
                        </select>
                      </div>

                      {/* Text Size */}
                      <div>
                        <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-[#75665C] mb-1">
                          <span>Text Size</span>
                          <span className="text-[#30231F]">{textSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="32"
                          value={textSize}
                          onChange={e => setTextSize(parseInt(e.target.value))}
                          className="w-full accent-[#590907] cursor-pointer"
                        />
                      </div>

                      {/* Text Rotation */}
                      <div>
                        <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-[#75665C] mb-1">
                          <span>Text Rotation</span>
                          <span className="text-[#30231F]">{textRotation}°</span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={textRotation}
                          onChange={e => setTextRotation(parseInt(e.target.value))}
                          className="w-full accent-[#590907] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Size Selection */}
                <div>
                  <label className="text-[#30231F] text-xs tracking-wider uppercase font-bold block mb-2.5">
                    Choose Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {safeSizes.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`w-12 h-11 border text-xs font-black uppercase transition-all ${
                          size === s
                            ? 'bg-[#590907] text-white border-[#590907] shadow-sm'
                            : 'bg-white border-[#D4BEA5] text-[#30231F] hover:border-[#590907]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. Print Position */}
                <div>
                  <label className="text-[#30231F] text-xs tracking-wider uppercase font-bold block mb-2.5">
                    Print Placement
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {POSITIONS.map(pos => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => handlePositionChange(pos)}
                        className={`py-3 px-3 border text-center transition-all ${
                          position === pos
                            ? 'bg-[#590907] text-white border-[#590907] shadow-sm'
                            : 'bg-white border-[#D4BEA5] text-[#30231F] hover:border-[#590907]'
                        }`}
                      >
                        <span className="block text-xs font-bold uppercase">{pos}</span>
                        <span className={`text-[11px] font-semibold mt-0.5 block ${position === pos ? 'text-white/80' : 'text-[#590907]'}`}>
                          ₹{(fit === 'Oversize' ? (safeOversize[pos] || 0) : (safeRegular[pos] || 0)).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#75665C] mt-2.5 p-2.5 border border-[#D4BEA5] bg-[#F3E7D8]/60">
                    <strong className="text-[#30231F]">Note:</strong> Small front-chest crest prints receive automatic price discounts before production.
                  </p>
                </div>

                {/* 7. Description */}
                <div>
                  <label className="text-[#30231F] text-xs tracking-wider uppercase font-bold block mb-2">
                    Production Instructions (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="w-full p-3 text-xs bg-white border border-[#D4BEA5] text-[#30231F] leading-relaxed focus:border-[#590907] outline-none"
                    placeholder="e.g. Chest-center placement, A4 print size, please ensure vivid colors..."
                  />
                  <p className="text-[#75665C] text-[10px] mt-1 text-right">{description.length}/1000</p>
                </div>

                {!user && (
                  <div className="p-3.5 border border-amber-300 bg-amber-50">
                    <p className="text-amber-900 text-xs font-semibold">
                      Please{' '}
                      <Link to="/login" className="underline font-bold text-[#590907]">sign in</Link>
                      {' '}to place and track your custom streetwear order.
                    </p>
                  </div>
                )}

                <motion.button
                  onClick={handleContinue}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 bg-[#590907] hover:bg-[#430605] text-white text-xs font-bold uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 transition-all"
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
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              {/* Left: Review */}
              <div className="lg:col-span-2 space-y-6">

                {/* Design review */}
                <div className="bg-white border border-[#D4BEA5] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D4BEA5]">
                    <h2 className="text-[#30231F] text-sm font-black tracking-widest uppercase">Your Custom Spec</h2>
                    <button
                      onClick={() => setStep(2)}
                      className="text-[#590907] text-xs tracking-wider uppercase font-bold hover:underline"
                    >
                      Edit Options
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {previews.length > 0 ? (
                      <div className="flex sm:flex-col gap-2">
                        {previews.map((p, i) => (
                          <img key={i} src={p} alt="Design" className="w-20 h-20 object-contain bg-[#FAF5ED] border border-[#D4BEA5] p-1" />
                        ))}
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-[#FAF5ED] border border-[#D4BEA5] flex flex-col items-center justify-center text-[#75665C]">
                        {designStatus === 'WhatsApp' ? <MessageCircle size={24} className="text-emerald-600" /> : <Clock size={24} className="text-[#590907]" />}
                        <span className="text-[8px] mt-1 uppercase font-bold">{designStatus}</span>
                      </div>
                    )}
                    <div className="space-y-2 flex-1">
                      {[
                        ['Fit Silhouette', `${fit} Heavyweight`],
                        ['Selected Size', size],
                        ['T-Shirt Color', color],
                        ['Print Placement', position],
                        ['Design Asset', designStatus === 'Firebase' ? 'Uploaded to VYBERA Cloud' : designStatus],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between py-1 border-b border-[#FAF5ED] text-xs">
                          <span className="text-[#75665C] font-semibold">{k}</span>
                          <span className="text-[#30231F] font-bold">{v}</span>
                        </div>
                      ))}
                      {description && (
                        <div className="pt-2 text-xs">
                          <p className="text-[#75665C] font-semibold">Special Instructions:</p>
                          <p className="text-[#30231F] mt-1 bg-[#FAF5ED] p-2.5 border border-[#D4BEA5]">
                            {description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Info */}
                <div className="bg-white border border-[#D4BEA5] p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-[#30231F] text-sm font-bold tracking-wider uppercase">Base Price for this design</h2>
                    <p className="text-[#75665C] text-xs mt-0.5">Includes heavyweight blank & custom print setup.</p>
                  </div>
                  <span className="text-[#590907] font-black text-3xl">₹{basePrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Right: Add to Cart */}
              <div className="h-fit lg:sticky lg:top-24">
                <div className="bg-white border border-[#D4BEA5] p-6 space-y-4 shadow-lg">
                  <h2 className="text-[#30231F] font-black tracking-widest uppercase text-sm border-b border-[#D4BEA5] pb-3">
                    Order Summary
                  </h2>

                  {/* Summary */}
                  <div className="space-y-2.5 pb-4 border-b border-[#D4BEA5] text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#75665C]">Placement</span>
                      <span className="text-[#30231F] font-bold">{position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75665C]">Fit</span>
                      <span className="text-[#30231F] font-bold">{fit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75665C]">Color</span>
                      <span className="text-[#30231F] font-bold">{color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75665C]">Size</span>
                      <span className="text-[#30231F] font-bold">{size}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm pt-2 border-t border-[#D4BEA5]">
                      <span className="text-[#30231F]">Item Total</span>
                      <span className="text-[#590907]">₹{basePrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-3 border border-amber-300 bg-amber-50 text-[11px] text-amber-900 space-y-1">
                    <p className="font-bold uppercase tracking-wider">⚠️ Bespoke Production Policy</p>
                    <p className="text-amber-800 text-[10px] leading-relaxed">
                      Custom items are printed uniquely for you according to your uploaded artwork and cannot be cancelled once in production.
                    </p>
                  </div>

                  <motion.button
                    onClick={handleAddToCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-[#590907] hover:bg-[#430605] text-white text-xs font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Shirt size={16} />
                    ADD TO BAG — ₹{basePrice.toLocaleString()}
                  </motion.button>

                  <p className="text-[#75665C] text-[10px] text-center leading-relaxed">
                    You can combine this with regular drop tees and apply coupons directly at checkout.
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
