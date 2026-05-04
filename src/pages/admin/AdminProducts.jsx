import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Upload, Image } from 'lucide-react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../../firebase/products';
import toast from 'react-hot-toast';

const SIZES_ALL = ['S', 'M', 'L', 'XL', 'XXL'];
const PLACEHOLDER = 'https://placehold.co/200x250/141414/888888?text=NX';

const CATEGORIES = [
  { value: 'normal', label: 'Normal (All)' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'unisex', label: 'Unisex' },
  { value: 'couple', label: 'Couple' },
  { value: 'embroidery', label: 'Embroidery' },
  { value: 'kids', label: 'Kids' },
];

const emptyForm = {
  name: '', price: '', originalPrice: '', description: '', sizes: [], outOfStockSizes: [], featured: false, isDrop: false,
  inStock: true, material: '', fit: 'Oversized', image: '', category: 'normal', colors: [],
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

const ProductModal = ({ product, onClose, onSaved }) => {
  const [form, setForm] = useState(product ? { ...emptyForm, ...product } : emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [localPreviews, setLocalPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState(
    product?.images || (product?.image ? [product.image] : [])
  );
  const [loading, setLoading] = useState(false);
  const [newColor, setNewColor] = useState('');
  const fileRef = useRef();

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
        price: Number(form.price), 
        originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
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
        className="bg-vy-dark border border-vy-border w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-vy-border">
          <h2 className="text-vy-white font-semibold tracking-wider">
            {product?.id ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="text-vy-grey hover:text-vy-white transition-colors">
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
                value={form.category || 'normal'}
                onChange={onChange}
                className="vy-input"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
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
                <div key={i} className="flex items-center justify-between gap-4 p-3 bg-vy-border/10 border border-vy-border rounded-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-vy-white text-xs uppercase tracking-wider font-bold">{c.name || c}</span>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, colors: f.colors.filter((_, idx) => idx !== i) }))}
                      className="text-vy-grey hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest">Mockup:</label>
                    <div className="flex gap-1">
                      {[...existingImages, ...localPreviews].map((url, imgIdx) => (
                        <button
                          key={imgIdx}
                          type="button"
                          onClick={() => {
                            const newColors = [...form.colors];
                            newColors[i] = { ...newColors[i], imageIndex: imgIdx };
                            setForm(f => ({ ...f, colors: newColors }));
                          }}
                          className={`w-8 h-10 border transition-all ${
                            c.imageIndex === imgIdx ? 'border-vy-white opacity-100 scale-110 z-10' : 'border-vy-border opacity-40 hover:opacity-70'
                          }`}
                        >
                          <img src={url} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Per-color Size Stock */}
                  <div className="flex items-center gap-3 border-l border-vy-border pl-4">
                    <label className="text-vy-grey text-[10px] uppercase tracking-widest">Out of Stock Sizes:</label>
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
                          className={`w-6 h-6 border flex items-center justify-center text-[10px] font-bold transition-all ${
                            (c.outOfStockSizes || []).includes(s)
                              ? 'border-red-500 bg-red-500/20 text-red-400'
                              : 'border-vy-border text-vy-grey hover:border-vy-grey'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
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

          <div className="flex gap-6">
            {[['featured', 'Featured'], ['isDrop', 'Limited Drop'], ['inStock', 'In Stock']].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key] !== undefined ? form[key] : true}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-white"
                />
                <span className="text-vy-grey text-xs tracking-widest uppercase">{label}</span>
              </label>
            ))}
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

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | {} | product
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    getProducts().then(p => { setProducts(p); setLoading(false); });
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">Products</h1>
        </div>
        <div className="flex gap-3">
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="btn-outline border-red-500/50 text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-xs"
              >
                {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
              </motion.button>
            )}
          </AnimatePresence>
          <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2 text-xs">
            <Plus size={13} /> Add Product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : (
        <div className="bg-vy-card border border-vy-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-vy-border">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-vy-white rounded-none cursor-pointer"
                  />
                </th>
                {['Image', 'Name', 'Price', 'Category', 'Stock', 'Sizes', 'Featured', 'Drop', 'Actions'].map(h => (
                  <th key={h} className="text-vy-grey text-xs tracking-widest uppercase text-left px-4 py-3 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className={`border-b border-vy-border/50 hover:bg-vy-white/[0.02] transition-colors ${selectedIds.includes(p.id) ? 'bg-vy-white/[0.03]' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelectOne(p.id)}
                      className="w-4 h-4 accent-vy-white rounded-none cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <img src={p.images?.[0] || p.image || PLACEHOLDER} alt={p.name} className="w-10 h-12 object-cover bg-vy-dark" />
                  </td>
                  <td className="px-4 py-3 text-vy-white font-medium max-w-xs truncate">{p.name}</td>
                  <td className="px-4 py-3 text-vy-white font-semibold">₹{p.price?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-vy-grey capitalize px-2 py-1 border border-vy-border/50 bg-vy-border/10">
                      {p.category || 'normal'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${p.inStock !== false ? 'text-green-400' : 'text-red-400'}`}>
                      {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-vy-grey text-xs">{p.sizes?.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${p.featured ? 'text-green-400' : 'text-vy-border'}`}>
                      {p.featured ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${p.isDrop ? 'text-blue-400' : 'text-vy-border'}`}>
                      {p.isDrop ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setModal(p)}
                        className="p-1.5 text-vy-grey hover:text-vy-white transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(p)}
                        className="p-1.5 text-vy-grey hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-16">
              <p className="text-vy-grey text-sm tracking-widest uppercase">No products yet</p>
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
