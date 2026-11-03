import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Upload, Image, Sliders, Flame, Tag, Layers, Search, Sparkles, RefreshCw, Home } from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct, bulkUpdateProducts } from '../../firebase/products';
import { getSections } from '../../firebase/sections';
import { isProductSaleActive, isProductNewDropActive } from '../../utils/pricing';
import { getSizeGuides } from '../../firebase/sizeGuides';
import toast from 'react-hot-toast';

const SIZES_ALL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PLACEHOLDER = 'https://placehold.co/200x250/141414/888888?text=NX';

const emptyForm = {
  name: '', price: '', originalPrice: '', campaignPrice: '', description: '', sizes: [], outOfStockSizes: [], featured: false, isDrop: false,
  inStock: true, material: '', fit: 'Oversized', image: '', category: 'shop', colors: [],
  showInCollections: true,
  showInNewDrops: false,
  showInSale: false,
  showOnHome: true,
  newDropPriority: 0,
  salePriority: 0,
  salePrice: '',
  saleStartAt: '',
  saleEndAt: '',
  newDropStartAt: '',
  newDropEndAt: '',
  saleCampaignImage: '',
};

// Extremely aggressive native image compressor to convert generic photos to fast WebP formats
const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file); // Fallback if compression fails
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            }));
          },
          'image/webp',
          quality
        );
      };
    };
  });
};

const ProductModal = ({ product, onClose, onSaved, dynamicCategories = [] }) => {
  const [form, setForm] = useState(product ? { ...emptyForm, ...product } : emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [localPreviews, setLocalPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState(
    product?.images || (product?.image ? [product.image] : [])
  );
  const [loading, setLoading] = useState(false);
  const [newColor, setNewColor] = useState('');
  const fileRef = useRef();
  const [sizeGuides, setSizeGuides] = useState([]);

  useEffect(() => {
    getSizeGuides().then(setSizeGuides);
  }, []);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const toggleSize = s => setForm(f => ({
    ...f, sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s],
  }));
  const toggleOutOfStockSize = s => setForm(f => ({
    ...f, outOfStockSizes: f.outOfStockSizes?.includes(s) ? f.outOfStockSizes.filter(x => x !== s) : [...(f.outOfStockSizes || []), s],
  }));

  const onFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) {
      setImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setLocalPreviews(prev => [...prev, ...newPreviews]);
    }
    // reset input so the same file can be selected again if removed
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNewImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setLocalPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast.error('Name and price are required.', { className: 'toast-vybera' });
      return;
    }
    if (Number(form.price) < 0) {
      toast.error('Price cannot be negative.', { className: 'toast-vybera' });
      return;
    }
    if (form.showInSale) {
      if (!form.salePrice || Number(form.salePrice) <= 0) {
        toast.error('Please enter a valid Sale Price greater than ₹0.', { className: 'toast-vybera' });
        return;
      }
      if (Number(form.salePrice) >= Number(form.price)) {
        toast.error(`Sale Price (₹${form.salePrice}) must be lower than Selling Price (₹${form.price}).`, { className: 'toast-vybera' });
        return;
      }
    }
    
    try {
      if (imageFiles.length > 0) {
        setLoading('Compressing Images...');
      } else {
        setLoading('Saving to Database...');
      }

      console.log("[AdminProducts] Starting save. Form:", form);
      // Strip undefined values explicitly just in case custom form inputs wipe them
      const safeForm = Object.fromEntries(Object.entries(form).filter(([_, v]) => v !== undefined));
      const data = { 
        ...safeForm, 
        price: Math.max(0, Number(form.price)), 
        originalPrice: form.originalPrice ? Math.max(0, Number(form.originalPrice)) : null,
        campaignPrice: form.campaignPrice ? Math.max(0, Number(form.campaignPrice)) : null,
        salePrice: form.salePrice ? Math.max(0, Number(form.salePrice)) : null,
        showInCollections: form.showInCollections !== undefined ? Boolean(form.showInCollections) : true,
        showInNewDrops: Boolean(form.showInNewDrops),
        showInSale: Boolean(form.showInSale),
        showOnHome: form.showOnHome !== undefined ? Boolean(form.showOnHome) : Boolean(form.featured || form.isFeatured),
        newDropPriority: Number(form.newDropPriority) || 0,
        salePriority: Number(form.salePriority) || 0,
        isFeatured: Boolean(form.featured || form.isFeatured || form.showOnHome),
        featured: Boolean(form.featured || form.isFeatured || form.showOnHome),
        isDrop: Boolean(form.showInNewDrops),
        images: existingImages 
      };
      
      let optimizedFiles = [];
      if (imageFiles.length > 0) {
        setLoading('Optimizing Upload Payload...');
        optimizedFiles = await Promise.all(imageFiles.map(f => compressImage(f)));
        setLoading('Uploading fast WebP to Server...');
      }

      if (product?.id) {
        console.log("[AdminProducts] Updating product", product.id);
        await updateProduct(product.id, data, optimizedFiles);
        toast.success('Product updated.', { className: 'toast-vybera' });
      } else {
        console.log("[AdminProducts] Adding new product");
        await addProduct(data, optimizedFiles);
        toast.success('Product added.', { className: 'toast-vybera' });
      }
      onSaved();
    } catch (e) {
      console.error("[AdminProducts] FATAL ERROR IN SAVE:", e);
      toast.error(`Error: ${e.message}`, { className: 'toast-vybera', duration: 8000 });
    } finally {
      console.log("[AdminProducts] Ending save state");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#FAF5ED] border border-[#D4BEA5] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-sm shadow-xl"
      >
        <div className="flex items-center justify-between p-6 border-b border-[#D4BEA5]">
          <h2 className="text-[#30231F] font-bold text-lg tracking-wider">
            {product?.id ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-[#75665C] hover:text-[#30231F] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-3">Product Images</label>
            
            <div className="flex flex-wrap gap-4 mb-3">
              {existingImages.map((img, idx) => (
                <div key={`ext-${idx}`} className="relative h-24 w-20 border border-vy-border bg-vy-card group">
                  <img src={img} alt="preview" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={12}/></button>
                </div>
              ))}
              {localPreviews.map((preview, idx) => (
                <div key={`loc-${idx}`} className="relative h-24 w-20 border border-vy-border bg-vy-card group">
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={12}/></button>
                </div>
              ))}
              
              <div
                onClick={() => fileRef.current?.click()}
                className="h-24 w-20 border border-dashed border-vy-border flex flex-col items-center justify-center cursor-pointer hover:border-vy-grey transition-colors bg-vy-card text-vy-grey"
              >
                <Plus size={20} />
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
            
            <div className="mt-1 flex gap-2">
              <input
                id="urlInput"
                className="vy-input text-xs flex-1"
                placeholder="Paste image URL and click add"
              />
              <button 
                type="button" 
                onClick={() => {
                  const val = document.getElementById('urlInput').value;
                  if (val) { setExistingImages([...existingImages, val]); document.getElementById('urlInput').value = ''; }
                }}
                className="btn-outline px-3 py-2 text-xs"
              >
                Add URL
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Product Name</label>
              <input name="name" value={form.name} onChange={onChange} className="vy-input" placeholder="VYBERA Oversized Tee" required />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Selling Price (₹)</label>
              <input name="price" type="number" value={form.price} onChange={onChange} className="vy-input" placeholder="999" required />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Original Price (₹)</label>
              <input name="originalPrice" type="number" value={form.originalPrice || ''} onChange={onChange} className="vy-input" placeholder="1499" />
            </div>
            <div className="col-span-2">
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Campaign Price Override (₹)</label>
              <input name="campaignPrice" type="number" value={form.campaignPrice || ''} onChange={onChange} className="vy-input" placeholder="Optional: E.g. 799" />
              <p className="text-[10px] text-vy-grey mt-1">Overrides standard price during active campaigns.</p>
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Fit</label>
              <input name="fit" value={form.fit} onChange={onChange} className="vy-input" placeholder="Oversized" />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Material</label>
              <input name="material" value={form.material} onChange={onChange} className="vy-input" placeholder="100% Cotton" />
            </div>
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Category</label>
              <select
                name="category"
                value={form.category || 'shop'}
                onChange={onChange}
                className="vy-input"
              >
                {dynamicCategories.map(c => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Colors</label>
            <div className="flex gap-2 mb-3">
              <input
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!newColor.trim()) return;
                    setForm(f => ({ ...f, colors: [...(f.colors || []), { name: newColor.trim() }] }));
                    setNewColor('');
                  }
                }}
                className="vy-input"
                placeholder="e.g. Black"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newColor.trim()) return;
                  setForm(f => ({ ...f, colors: [...(f.colors || []), { name: newColor.trim() }] }));
                  setNewColor('');
                }}
                className="px-4 bg-vy-white text-vy-black text-[10px] font-bold uppercase tracking-widest hover:bg-vy-accent transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {(form.colors || []).map((c, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-vy-white/[0.03] border border-vy-white/5 rounded-md hover:bg-vy-white/[0.05] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-vy-accent/20 flex items-center justify-center border border-vy-accent/30">
                      <span className="text-vy-white text-[10px] font-bold uppercase">{c.name?.[0] || '?'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-vy-white text-[11px] font-bold uppercase tracking-wider">{c.name || 'Unnamed'}</span>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, colors: f.colors.filter((_, idx) => idx !== i) }))}
                        className="text-red-400/60 hover:text-red-400 text-[9px] uppercase tracking-widest text-left transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    {/* Mockup Picker */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-vy-grey text-[9px] uppercase tracking-[0.2em]">Linked Mockup</label>
                      <div className="flex gap-1.5">
                        {[...existingImages, ...localPreviews].map((url, imgIdx) => (
                          <button
                            key={imgIdx}
                            type="button"
                            onClick={() => {
                              const newColors = [...form.colors];
                              newColors[i] = { ...newColors[i], imageIndex: imgIdx };
                              setForm(f => ({ ...f, colors: newColors }));
                            }}
                            className={`w-7 h-9 rounded-sm overflow-hidden border-2 transition-all duration-300 relative group ${
                              c.imageIndex === imgIdx 
                                ? 'border-vy-white scale-110 shadow-lg shadow-black/50 z-10' 
                                : 'border-transparent opacity-40 hover:opacity-100'
                            }`}
                          >
                            <img src={url} className="w-full h-full object-cover" />
                            {c.imageIndex === imgIdx && (
                              <div className="absolute inset-0 bg-vy-white/10" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Per-color Size Stock */}
                    <div className="flex flex-col gap-1.5 border-l border-vy-white/10 pl-6">
                      <label className="text-vy-grey text-[9px] uppercase tracking-[0.2em]">Enabled Sizes</label>
                      <div className="flex gap-1">
                        {form.sizes.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              const newColors = [...form.colors];
                              const oos = newColors[i].outOfStockSizes || [];
                              newColors[i] = {
                                ...newColors[i],
                                outOfStockSizes: oos.includes(s) ? oos.filter(x => x !== s) : [...oos, s]
                              };
                              setForm(f => ({ ...f, colors: newColors }));
                            }}
                            className={`w-6 h-6 rounded-sm border text-[9px] font-bold transition-all duration-200 ${
                              (c.outOfStockSizes || []).includes(s)
                                ? 'border-red-500/30 bg-red-500/10 text-red-400/50 line-through'
                                : 'border-vy-accent/50 bg-vy-accent/10 text-vy-white'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Description</label>
            <textarea name="description" value={form.description} onChange={onChange} rows={3} className="vy-input resize-none" placeholder="Product description..." />
          </div>

          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Size Guide</label>
            <select
              value={form.sizeGuideId || ''}
              onChange={e => setForm(f => ({ ...f, sizeGuideId: e.target.value }))}
              className="vy-input text-xs"
            >
              <option value="">No Size Guide</option>
              {sizeGuides.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-3">Available Sizes</label>
            <div className="flex gap-2">
              {SIZES_ALL.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className={`size-btn ${form.sizes.includes(s) ? 'selected' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {form.sizes.length > 0 && (
            <div>
              <label className="text-red-400 text-xs tracking-widest uppercase block mb-3">Out of Stock Sizes (Specific)</label>
              <div className="flex gap-2">
                {form.sizes.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleOutOfStockSize(s)}
                    className={`size-btn ${(form.outOfStockSizes || []).includes(s) ? 'selected border-red-500 text-red-400 !bg-red-500/10' : ''}`}
                    title={`Mark ${s} as Out of Stock`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              PRODUCT DISPLAY SETTINGS (MANUAL HOMEPAGE & SECTION CONTROL)
          ══════════════════════════════════════════════════════════ */}
          <div className="bg-[#FAF5ED] border-2 border-[#D4BEA5] p-5 rounded-xs space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#D4BEA5] pb-2">
              <span className="text-xs font-black tracking-widest text-[#590907] uppercase">
                Product Display Settings
              </span>
              <span className="text-[10px] text-[#75665C] font-semibold">
                Select where this product appears
              </span>
            </div>

            {/* Four Master Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Show in Home */}
              <label className={`flex items-start gap-3 p-3 border rounded-xs cursor-pointer transition-all ${
                form.showOnHome ? 'border-[#590907] bg-[#E8D2B5]/40 text-[#30231F]' : 'border-[#D4BEA5] bg-white text-[#75665C]'
              }`}>
                <input
                  type="checkbox"
                  checked={form.showOnHome !== false}
                  onChange={e => setForm(f => ({ ...f, showOnHome: e.target.checked, isFeatured: e.target.checked, featured: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-[#590907]"
                />
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block">Home Page</span>
                  <span className="text-[10px] text-[#75665C] block">Featured on Home Screen</span>
                </div>
              </label>

              {/* 2. Show in Collections */}
              <label className={`flex items-start gap-3 p-3 border rounded-xs cursor-pointer transition-all ${
                form.showInCollections ? 'border-[#590907] bg-[#E8D2B5]/40 text-[#30231F]' : 'border-[#D4BEA5] bg-white text-[#75665C]'
              }`}>
                <input
                  type="checkbox"
                  checked={form.showInCollections !== false}
                  onChange={e => setForm(f => ({ ...f, showInCollections: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-[#590907]"
                />
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block">Collections</span>
                  <span className="text-[10px] text-[#75665C] block">Visible in regular catalog</span>
                </div>
              </label>

              {/* 3. Show in New Drops */}
              <label className={`flex items-start gap-3 p-3 border rounded-xs cursor-pointer transition-all ${
                form.showInNewDrops ? 'border-[#590907] bg-[#E8D2B5]/40 text-[#30231F]' : 'border-[#D4BEA5] bg-white text-[#75665C]'
              }`}>
                <input
                  type="checkbox"
                  checked={Boolean(form.showInNewDrops)}
                  onChange={e => setForm(f => ({ ...f, showInNewDrops: e.target.checked, isDrop: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-[#590907]"
                />
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block">New Drops</span>
                  <span className="text-[10px] text-[#75665C] block">Hero drops & /new-drops</span>
                </div>
              </label>

              {/* 4. Show in Sale */}
              <label className={`flex items-start gap-3 p-3 border rounded-xs cursor-pointer transition-all ${
                form.showInSale ? 'border-[#590907] bg-[#E8D2B5]/40 text-[#30231F]' : 'border-[#D4BEA5] bg-white text-[#75665C]'
              }`}>
                <input
                  type="checkbox"
                  checked={Boolean(form.showInSale)}
                  onChange={e => setForm(f => ({ ...f, showInSale: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-[#590907]"
                />
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block">Sale Section</span>
                  <span className="text-[10px] text-[#75665C] block">Homepage sale & /sale</span>
                </div>
              </label>
            </div>

            {/* Conditional New Drop Settings */}
            {form.showInNewDrops && (
              <div className="pt-3 border-t border-[#D4BEA5] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#590907] animate-pulse" />
                  <span className="text-[11px] font-bold text-[#590907] uppercase tracking-wider">
                    New Drop Controls
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#75665C] uppercase tracking-wider block mb-1">
                      Display Priority (Higher = First)
                    </label>
                    <input
                      name="newDropPriority"
                      type="number"
                      value={form.newDropPriority ?? 0}
                      onChange={onChange}
                      className="vy-input text-xs"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#75665C] uppercase tracking-wider block mb-1">
                      Drop Start Date (Optional)
                    </label>
                    <input
                      name="newDropStartAt"
                      type="datetime-local"
                      value={form.newDropStartAt || ''}
                      onChange={onChange}
                      className="vy-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#75665C] uppercase tracking-wider block mb-1">
                      Drop End Date (Optional)
                    </label>
                    <input
                      name="newDropEndAt"
                      type="datetime-local"
                      value={form.newDropEndAt || ''}
                      onChange={onChange}
                      className="vy-input text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Sale Settings */}
            {form.showInSale && (
              <div className="pt-3 border-t border-[#D4BEA5] space-y-3 bg-[#FAF5ED] p-3 border border-[#D4BEA5]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-[#590907] uppercase tracking-wider flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-[#590907] text-white text-[9px]">SALE</span>
                    Sale Price & Campaign Controls
                  </span>
                  {/* Live Discount Calculator Preview */}
                  {form.price && form.salePrice && Number(form.salePrice) < Number(form.price) && (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-full">
                      🔥 Save {Math.round(((Number(form.price) - Number(form.salePrice)) / Number(form.price)) * 100)}% OFF
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#590907] uppercase tracking-wider block mb-1">
                      Sale Price (₹) *
                    </label>
                    <input
                      name="salePrice"
                      type="number"
                      value={form.salePrice ?? ''}
                      onChange={onChange}
                      className="vy-input text-xs border-[#590907] font-bold"
                      placeholder="e.g. 599"
                      required={form.showInSale}
                    />
                    <p className="text-[9px] text-[#75665C] mt-0.5">Must be less than regular price (₹{form.price || 0})</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#75665C] uppercase tracking-wider block mb-1">
                      Sale Start Date
                    </label>
                    <input
                      name="saleStartAt"
                      type="datetime-local"
                      value={form.saleStartAt || ''}
                      onChange={onChange}
                      className="vy-input text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#75665C] uppercase tracking-wider block mb-1">
                      Sale End Date
                    </label>
                    <input
                      name="saleEndAt"
                      type="datetime-local"
                      value={form.saleEndAt || ''}
                      onChange={onChange}
                      className="vy-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-[#75665C] uppercase tracking-wider block mb-1">
                      Sale Display Priority
                    </label>
                    <input
                      name="salePriority"
                      type="number"
                      value={form.salePriority ?? 0}
                      onChange={onChange}
                      className="vy-input text-xs"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#75665C] uppercase tracking-wider block mb-1">
                      Sale Campaign Banner URL (Optional)
                    </label>
                    <input
                      name="saleCampaignImage"
                      type="text"
                      value={form.saleCampaignImage || ''}
                      onChange={onChange}
                      className="vy-input text-xs"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* General Attributes: Featured & In Stock */}
            <div className="flex items-center gap-6 pt-2 border-t border-[#D4BEA5]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.isFeatured || form.featured)}
                  onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked, featured: e.target.checked }))}
                  className="w-4 h-4 accent-[#590907]"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[#30231F]">Featured Product</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.inStock !== false}
                  onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))}
                  className="w-4 h-4 accent-[#590907]"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[#30231F]">In Stock</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading !== false} className="btn-primary flex-1 disabled:opacity-60 transition-all">
              {loading !== false ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner w-3 h-3" /> {loading}
                </span>
              ) : product?.id ? 'Update' : 'Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const BulkEditModal = ({ onClose, onSaved, selectedCount, productsCount, defaultTargetScope }) => {
  const [targetScope, setTargetScope] = useState(defaultTargetScope || 'all');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [campaignPrice, setCampaignPrice] = useState('');
  const [stockStatus, setStockStatus] = useState('no_change');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price && !originalPrice && !campaignPrice && stockStatus === 'no_change') {
      toast.error('Please specify at least one field to update.', { className: 'toast-vybera' });
      return;
    }

    setLoading(true);
    try {
      const data = {};
      if (price) data.price = Number(price);
      if (originalPrice) {
        data.originalPrice = Number(originalPrice) === 0 ? null : Number(originalPrice);
      }
      if (campaignPrice) {
        data.campaignPrice = Number(campaignPrice) === 0 ? null : Number(campaignPrice);
      }
      if (stockStatus !== 'no_change') {
        data.inStock = stockStatus === 'in_stock';
      }
      await onSaved(targetScope, data);
    } catch (err) {
      console.error(err);
      toast.error('Bulk update failed: ' + err.message, { className: 'toast-vybera' });
    } finally {
      setLoading(false);
    }
  };

  const countAffected = targetScope === 'selected' ? selectedCount : productsCount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-vy-dark border border-vy-border w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-vy-border">
          <h2 className="text-vy-white font-semibold tracking-wider">
            Bulk Edit Products
          </h2>
          <button onClick={onClose} className="text-vy-grey hover:text-vy-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {selectedCount > 0 && (
            <div>
              <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Target Range</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetScope('selected')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                    targetScope === 'selected'
                      ? 'border-vy-white bg-vy-white/10 text-vy-white'
                      : 'border-vy-border bg-transparent text-vy-grey hover:text-vy-white hover:border-vy-grey'
                  }`}
                >
                  Selected ({selectedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScope('all')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${
                    targetScope === 'all'
                      ? 'border-vy-white bg-vy-white/10 text-vy-white'
                      : 'border-vy-border bg-transparent text-vy-grey hover:text-vy-white hover:border-vy-grey'
                  }`}
                >
                  All ({productsCount})
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">
              New Selling Price (₹)
            </label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="vy-input"
              placeholder="Keep current price"
            />
            <p className="text-[10px] text-vy-grey mt-1">Leave empty to keep existing pricing.</p>
          </div>

          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">
              New Original/Discount Price (₹)
            </label>
            <input
              type="number"
              value={originalPrice}
              onChange={e => setOriginalPrice(e.target.value)}
              className="vy-input"
              placeholder="Keep current original price"
            />
            <p className="text-[10px] text-vy-grey mt-1">Leave empty to keep existing original price. Set to 0 to clear discount.</p>
          </div>

          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">
              New Campaign Price Override (₹)
            </label>
            <input
              type="number"
              value={campaignPrice}
              onChange={e => setCampaignPrice(e.target.value)}
              className="vy-input"
              placeholder="Keep current campaign price"
            />
            <p className="text-[10px] text-vy-grey mt-1">Leave empty to keep existing campaign price. Set to 0 to clear override.</p>
          </div>

          <div>
            <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">
              Global Stock Status
            </label>
            <select
              value={stockStatus}
              onChange={e => setStockStatus(e.target.value)}
              className="vy-input"
            >
              <option value="no_change">Keep Current Stock Status</option>
              <option value="in_stock">Set to: In Stock</option>
              <option value="out_stock">Set to: Out of Stock</option>
            </select>
          </div>

          <div className="bg-vy-white/[0.02] border border-vy-border/50 p-4 text-center">
            <p className="text-vy-grey text-xs">
              This action will update <span className="text-vy-white font-semibold">{countAffected}</span> product(s) at once.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60 transition-all">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner w-3 h-3" /> Updating...
                </span>
              ) : 'Apply Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | {} | product
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [sectionTab, setSectionTab] = useState('all'); // 'all' | 'drops' | 'sale' | 'collections'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const handleToggleSection = async (product, field) => {
    try {
      let currentVal;
      if (field === 'showInCollections') {
        currentVal = product.showInCollections !== false;
      } else if (field === 'showOnHome') {
        currentVal = product.showOnHome !== false && Boolean(product.showOnHome || product.isFeatured || product.featured);
      } else {
        currentVal = Boolean(product[field]);
      }
      const nextVal = !currentVal;
      const payload = { [field]: nextVal };
      if (field === 'showInNewDrops') payload.isDrop = nextVal;
      if (field === 'showOnHome') {
        payload.showOnHome = nextVal;
        payload.featured = nextVal;
        payload.isFeatured = nextVal;
      }
      await updateProduct(product.id, payload);
      toast.success(`Updated ${product.name} display settings.`, { className: 'toast-vybera' });
      fetchProducts();
    } catch {
      toast.error('Failed to update display settings.', { className: 'toast-vybera' });
    }
  };

  const handleBulkUpdate = async (scope, data) => {
    const targetIds = scope === 'selected' ? selectedIds : products.map(p => p.id);
    if (targetIds.length === 0) {
      toast.error('No products to update.', { className: 'toast-vybera' });
      return;
    }

    try {
      await bulkUpdateProducts(targetIds, data);
      toast.success(`Bulk updated ${targetIds.length} product(s) successfully!`, { className: 'toast-vybera' });
      setShowBulkModal(false);
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error('Bulk update failed: ' + err.message, { className: 'toast-vybera' });
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getProducts(), getSections()]);
      setProducts(p);
      setSections(s);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (product) => {
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted.', { className: 'toast-vybera' });
      fetchProducts();
    } catch {
      toast.error('Failed to delete.', { className: 'toast-vybera' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected products?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => deleteProduct(id)));
      toast.success('Bulk deletion successful!', { className: 'toast-vybera' });
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete some products.', { className: 'toast-vybera' });
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

    // Analytics calculations
  const homeProductsCount = products.filter(p => p.showOnHome !== false && (p.showOnHome || p.isFeatured || p.featured)).length;
  const newDropsCount = products.filter(p => isProductNewDropActive(p)).length;
  const saleProductsCount = products.filter(p => p.showInSale === true || (p.salePrice && Number(p.salePrice) > 0)).length;
  const activeSaleCount = products.filter(p => isProductSaleActive(p)).length;
  const collectionProductsCount = products.filter(p => p.showInCollections !== false).length;

  // Filter products based on search, category and section tab
  const displayedProducts = products.filter(p => {
    // 1. Section tab filter
    if (sectionTab === 'home' && p.showOnHome === false && !p.isFeatured && !p.featured) return false;
    if (sectionTab === 'drops' && !isProductNewDropActive(p)) return false;
    if (sectionTab === 'sale' && !isProductSaleActive(p) && !p.showInSale) return false;
    if (sectionTab === 'collections' && p.showInCollections === false) return false;

    // 2. Category filter
    if (categoryFilter !== 'all' && (p.category || 'normal').toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }

    return true;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#D4BEA5]">
        <div>
          <p className="text-[#75665C] text-xs font-semibold tracking-widest uppercase mb-1">Admin Panel</p>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wider text-[#30231F]">
            Product Catalog & Section Manager
          </h1>
          <p className="text-xs text-[#75665C] mt-1">
            Manually control product display across New Drops, Sale, and Collections.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="btn-outline border-rose-300 text-rose-800 bg-rose-50 hover:bg-rose-100 flex items-center gap-2 text-xs font-bold"
              >
                {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
              </motion.button>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            title="Refresh product list from database"
            className="btn-secondary flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {products.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="btn-secondary flex items-center gap-2 text-xs font-bold"
            >
              <Sliders size={13} /> Bulk Edit
            </button>
          )}
          <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2 text-xs font-bold shadow-md">
            <Plus size={13} /> Add Product
          </button>
        </div>
      </div>

      {/* ── 7. Admin Dashboard Analytics Cards (5 Metrics) ──────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Products */}
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#75665C]">Total Products</span>
            <Layers size={16} className="text-[#30231F]" />
          </div>
          <p className="font-display font-bold text-3xl text-[#30231F]">{products.length}</p>
          <p className="text-[10px] text-[#75665C] mt-1">Full inventory database</p>
        </div>

        {/* Home Section */}
        <div
          onClick={() => setSectionTab('home')}
          className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-xs cursor-pointer hover:border-rose-900 transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-900 flex items-center gap-1.5">
              <Home size={12} className="text-rose-800" /> Home Section
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-900" />
          </div>
          <p className="font-display font-bold text-3xl text-rose-950">{homeProductsCount}</p>
          <p className="text-[10px] text-[#75665C] mt-1 group-hover:text-rose-900">Featured on Home Page</p>
        </div>

        {/* New Drops */}
        <div
          onClick={() => setSectionTab('drops')}
          className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-xs cursor-pointer hover:border-[#590907] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#590907] flex items-center gap-1.5">
              <Flame size={12} className="text-[#590907]" /> New Drops
            </span>
            <span className="w-2 h-2 rounded-full bg-[#590907] animate-pulse" />
          </div>
          <p className="font-display font-bold text-3xl text-[#590907]">{newDropsCount}</p>
          <p className="text-[10px] text-[#75665C] mt-1 group-hover:text-[#590907]">Assigned by admin to Drops</p>
        </div>

        {/* Sale Products */}
        <div
          onClick={() => setSectionTab('sale')}
          className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-xs cursor-pointer hover:border-[#D4AF37] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-900 flex items-center gap-1.5">
              <Tag size={12} className="text-amber-700" /> Sale Products
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-xs">
              {activeSaleCount} Live
            </span>
          </div>
          <p className="font-display font-bold text-3xl text-amber-900">{saleProductsCount}</p>
          <p className="text-[10px] text-[#75665C] mt-1 group-hover:text-amber-900">
            {saleProductsCount - activeSaleCount > 0 ? `${saleProductsCount - activeSaleCount} scheduled` : 'Discounted items'}
          </p>
        </div>

        {/* Collections */}
        <div
          onClick={() => setSectionTab('collections')}
          className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-xs cursor-pointer hover:border-[#30231F] transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#30231F]">Collections Catalog</span>
            <Sparkles size={16} className="text-[#75665C]" />
          </div>
          <p className="font-display font-bold text-3xl text-[#30231F]">{collectionProductsCount}</p>
          <p className="text-[10px] text-[#75665C] mt-1 group-hover:text-[#30231F]">All standard collections</p>
        </div>
      </div>

      {/* ── Section Filter Tabs & Search Controls ─────────────────────── */}
      <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#E8D2B5]/50 p-1 rounded-xs border border-[#D4BEA5]">
          <button
            type="button"
            onClick={() => setSectionTab('all')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-all ${
              sectionTab === 'all'
                ? 'bg-[#590907] text-white shadow-xs'
                : 'text-[#75665C] hover:text-[#30231F]'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionTab('home')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center gap-1.5 ${
              sectionTab === 'home'
                ? 'bg-[#590907] text-white shadow-xs'
                : 'text-[#75665C] hover:text-[#590907]'
            }`}
          >
            <Home size={12} /> Home ({homeProductsCount})
          </button>
          <button
            type="button"
            onClick={() => setSectionTab('drops')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center gap-1.5 ${
              sectionTab === 'drops'
                ? 'bg-[#590907] text-white shadow-xs'
                : 'text-[#75665C] hover:text-[#590907]'
            }`}
          >
            <Flame size={12} /> New Drops ({newDropsCount})
          </button>
          <button
            type="button"
            onClick={() => setSectionTab('sale')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center gap-1.5 ${
              sectionTab === 'sale'
                ? 'bg-[#590907] text-white shadow-xs'
                : 'text-[#75665C] hover:text-[#590907]'
            }`}
          >
            <Tag size={12} /> On Sale ({saleProductsCount})
          </button>
          <button
            type="button"
            onClick={() => setSectionTab('collections')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xs transition-all ${
              sectionTab === 'collections'
                ? 'bg-[#590907] text-white shadow-xs'
                : 'text-[#75665C] hover:text-[#30231F]'
            }`}
          >
            Collections ({collectionProductsCount})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75665C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D4BEA5] text-[#30231F] text-xs rounded-xs focus:outline-none focus:border-[#590907]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 bg-white border border-[#D4BEA5] text-[#30231F] text-xs rounded-xs focus:outline-none focus:border-[#590907]"
          >
            <option value="all">All Categories</option>
            {sections.map(s => (
              <option key={s.slug} value={s.slug}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Products Table ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] shadow-sm overflow-x-auto rounded-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#D4BEA5] bg-[#FAF5ED]">
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={displayedProducts.length > 0 && selectedIds.length === displayedProducts.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-[#590907] rounded-none cursor-pointer"
                  />
                </th>
                <th className="text-[#75665C] text-xs tracking-widest uppercase text-left px-3 py-3.5 font-bold">Image</th>
                <th className="text-[#75665C] text-xs tracking-widest uppercase text-left px-4 py-3.5 font-bold">Product</th>
                <th className="text-[#75665C] text-xs tracking-widest uppercase text-left px-3 py-3.5 font-bold">Regular</th>
                <th className="text-[#75665C] text-xs tracking-widest uppercase text-left px-3 py-3.5 font-bold">Sale Price</th>
                <th className="text-[#75665C] text-xs tracking-widest uppercase text-left px-3 py-3.5 font-bold">Display Sections</th>
                <th className="text-[#75665C] text-xs tracking-widest uppercase text-left px-3 py-3.5 font-bold">Category</th>
                <th className="text-[#75665C] text-xs tracking-widest uppercase text-left px-3 py-3.5 font-bold">Stock</th>
                <th className="text-[#75665C] text-xs tracking-widest uppercase text-center px-3 py-3.5 font-bold">Quick Section Toggle</th>
                <th className="text-[#75665C] text-xs tracking-widest uppercase text-right px-4 py-3.5 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map(p => {
                const isSale = isProductSaleActive(p);
                const isDrop = isProductNewDropActive(p);
                const isColl = p.showInCollections !== false;
                const isHome = p.showOnHome !== false && (p.showOnHome || p.isFeatured || p.featured);
                const regPrice = Number(p.price || 0);
                const sPrice = Number(p.salePrice || 0);
                const discount = regPrice > sPrice && sPrice > 0 ? Math.round(((regPrice - sPrice) / regPrice) * 100) : 0;

                return (
                  <tr key={p.id} className={`border-b border-[#D4BEA5] hover:bg-[#E8D2B5]/30 transition-colors ${selectedIds.includes(p.id) ? 'bg-[#E8D2B5]/40' : ''}`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelectOne(p.id)}
                        className="w-4 h-4 accent-[#590907] rounded-none cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <img src={p.images?.[0] || p.image || PLACEHOLDER} alt={p.name} className="w-10 h-12 object-cover bg-[#E8D2B5] border border-[#D4BEA5] rounded-xs" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[#30231F] font-bold max-w-xs truncate">{p.name}</p>
                      <p className="text-[10px] text-[#75665C]">{p.sizes?.join(', ') || 'Sizes: N/A'}</p>
                    </td>
                    <td className="px-3 py-3 text-[#30231F] font-bold font-mono">
                      ₹{regPrice.toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      {isSale ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-[#590907] font-mono">₹{sPrice.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded-xs w-max">
                            -{discount}% OFF
                          </span>
                        </div>
                      ) : p.showInSale ? (
                        <span className="text-[10px] text-amber-700 italic">Scheduled (₹{sPrice})</span>
                      ) : (
                        <span className="text-[#75665C] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {isHome && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-300">
                            Home
                          </span>
                        )}
                        {isColl && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#FAF5ED] border border-[#D4BEA5] text-[#30231F]">
                            Collections
                          </span>
                        )}
                        {isDrop && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#590907] text-[#FAF5ED]">
                            Drop {p.newDropPriority ? `#${p.newDropPriority}` : ''}
                          </span>
                        )}
                        {isSale && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300">
                            Sale
                          </span>
                        )}
                        {!isColl && !isDrop && !isSale && !isHome && (
                          <span className="text-[9px] text-[#75665C] italic">Hidden</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-[#30231F] font-semibold capitalize px-2 py-0.5 border border-[#D4BEA5] bg-[#E8D2B5] rounded-xs">
                        {p.category || 'normal'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-xs font-semibold ${p.inStock !== false ? 'text-emerald-900 bg-emerald-100 border border-emerald-300' : 'text-rose-900 bg-rose-100 border border-rose-300'}`}>
                        {p.inStock !== false ? 'In Stock' : 'Out'}
                      </span>
                    </td>
                    {/* Quick Section Toggles */}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1 border border-[#D4BEA5] p-1 bg-white rounded-xs">
                        {/* Toggle Home */}
                        <button
                          type="button"
                          onClick={() => handleToggleSection(p, 'showOnHome')}
                          className={`px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-xs ${
                            isHome
                              ? 'bg-rose-900 text-white shadow-xs'
                              : 'text-[#75665C] hover:bg-[#E8D2B5]/50'
                          }`}
                          title="Click to toggle Home section visibility"
                        >
                          Home
                        </button>

                        {/* Toggle Drops */}
                        <button
                          type="button"
                          onClick={() => handleToggleSection(p, 'showInNewDrops')}
                          className={`px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-xs ${
                            isDrop
                              ? 'bg-[#590907] text-white shadow-xs'
                              : 'text-[#75665C] hover:bg-[#E8D2B5]/50'
                          }`}
                          title="Click to add or remove from New Drops"
                        >
                          Drop
                        </button>

                        {/* Toggle Sale */}
                        <button
                          type="button"
                          onClick={() => {
                            if (!p.salePrice && !p.showInSale) {
                              setModal(p);
                              toast('Please set a sale price in Product Display Settings.', { icon: '🏷️' });
                            } else {
                              handleToggleSection(p, 'showInSale');
                            }
                          }}
                          className={`px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-xs ${
                            isSale
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-[#75665C] hover:bg-[#E8D2B5]/50'
                          }`}
                          title="Click to toggle Sale status"
                        >
                          Sale
                        </button>

                        {/* Toggle Collections */}
                        <button
                          type="button"
                          onClick={() => handleToggleSection(p, 'showInCollections')}
                          className={`px-2 py-1 text-[9px] font-bold uppercase transition-all rounded-xs ${
                            isColl
                              ? 'bg-[#30231F] text-white shadow-xs'
                              : 'text-[#75665C] hover:bg-[#E8D2B5]/50'
                          }`}
                          title="Click to toggle Collections visibility"
                        >
                          Coll
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal(p)}
                          className="p-1.5 text-[#590907] hover:bg-[#E8D2B5] rounded-xs transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p)}
                          className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-xs transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayedProducts.length === 0 && (
            <div className="text-center py-16 text-[#75665C]">
              <p className="text-sm tracking-widest uppercase">No products found in this section</p>
              <button
                type="button"
                onClick={() => { setSectionTab('all'); setSearchQuery(''); setCategoryFilter('all'); }}
                className="mt-2 text-xs font-bold text-[#590907] underline"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {modal !== null && (
          <ProductModal
            product={modal?.id ? modal : null}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); fetchProducts(); }}
            dynamicCategories={sections}
          />
        )}
      </AnimatePresence>

      {/* Bulk Edit Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <BulkEditModal
            onClose={() => setShowBulkModal(false)}
            onSaved={handleBulkUpdate}
            selectedCount={selectedIds.length}
            productsCount={products.length}
            defaultTargetScope={selectedIds.length > 0 ? 'selected' : 'all'}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-vy-dark border border-vy-border p-8 max-w-sm w-full text-center"
            >
              <h3 className="text-vy-white font-semibold mb-2 tracking-wider">Delete Product?</h3>
              <p className="text-vy-grey text-sm mb-6">"{deleteConfirm.name}" will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1">Cancel</button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium tracking-widest uppercase hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminProducts;
