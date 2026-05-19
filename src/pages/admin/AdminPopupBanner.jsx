/**
 * VYBERA — Admin Popup Banner Manager
 *
 * Full CRUD for popup banners with optimized image compression
 * and upload progress tracking. Same compression pipeline as products.
 */
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Upload, Eye, EyeOff, Image, ExternalLink, Megaphone, Zap, FolderOpen } from 'lucide-react';
import { getAllPopups, createPopup, updatePopup, deletePopup, togglePopupActive } from '../../firebase/popupBanner';
import toast from 'react-hot-toast';

// ── Lightning-Fast Image Compressor ───────────────────────────
// Key optimizations:
//  1. Files <500KB → skip compression entirely
//  2. createImageBitmap with resizeWidth (GPU-accelerated, no canvas resize)
//  3. setTimeout(0) defers work so UI never freezes
//  4. Max 700px wide — popup banners don't need more
//  5. Single-pass WebP at 0.55 quality — no recursion
const compressImageFast = (file) => {
  return new Promise((resolve) => {
    // Skip compression for small files or non-images
    if (!file.type.startsWith('image/') || file.size < 500 * 1024) {
      return resolve(file);
    }

    // Use setTimeout to guarantee UI renders first
    setTimeout(async () => {
      try {
        const MAX_W = 700;

        // createImageBitmap with resize is GPU-accelerated (fastest possible)
        const bitmap = await createImageBitmap(file, {
          resizeWidth: MAX_W,
          resizeQuality: 'medium',
        });

        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        bitmap.close();

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) return resolve(file);
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp', lastModified: Date.now(),
            }));
          },
          'image/webp',
          0.55
        );
      } catch {
        resolve(file); // On any error, use original
      }
    }, 0);
  });
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const PLACEHOLDER = 'https://placehold.co/600x400/1C2A21/B78E5C?text=VYBERA+Banner';

const AdminPopupBanner = () => {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Editor state
  const [form, setForm] = useState({ title: '', buttonText: '', buttonLink: '', isActive: true });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingLabel, setSavingLabel] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef();

  const fetchPopups = async () => {
    setLoading(true);
    const data = await getAllPopups();
    setPopups(data);
    setLoading(false);
  };

  useEffect(() => { fetchPopups(); }, []);

  const openEditor = (popup = null) => {
    if (popup) {
      setEditing(popup);
      setForm({
        title: popup.title || '',
        buttonText: popup.buttonText || '',
        buttonLink: popup.buttonLink || '',
        isActive: popup.isActive ?? true,
      });
      setImagePreview(popup.imageUrl || '');
    } else {
      setEditing(null);
      setForm({ title: '', buttonText: '', buttonLink: '', isActive: true });
      setImagePreview('');
    }
    setImageFile(null);
    setUploadProgress(0);
    setCompressing(false);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditing(null);
    setImageFile(null);
    setImagePreview('');
    setUploadProgress(0);
    setSaving(false);
    setSavingLabel('');
    setCompressing(false);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';

    // INSTANT preview — zero delay
    setImagePreview(URL.createObjectURL(file));

    // Small files don't need compression
    if (file.size < 500 * 1024) {
      setImageFile(file);
      setSavingLabel(`Ready — ${formatBytes(file.size)}`);
      return;
    }

    // Large files: compress in background
    setCompressing(true);
    setSavingLabel(`Optimizing ${formatBytes(file.size)}...`);

    compressImageFast(file).then((compressed) => {
      setImageFile(compressed);
      setCompressing(false);
      const ratio = ((1 - compressed.size / file.size) * 100).toFixed(0);
      setSavingLabel(`Ready — ${formatBytes(compressed.size)} (${ratio}% reduced)`);
    });
  };

  // Pick a local image from public/popbanner/ — INSTANT, no upload
  const pickLocalImage = (path) => {
    setImagePreview(path);
    setImageFile(null); // No file to upload — just a URL
    setCompressing(false);
    setSavingLabel('Using local image — instant save!');
  };

  const handleSave = async () => {
    if (!imageFile && !imagePreview) {
      toast.error('Please upload a banner image.', { className: 'toast-vybera' });
      return;
    }

    setSaving(true);
    setUploadProgress(0);

    try {
      if (imageFile) {
        setSavingLabel('Uploading optimized WebP...');
      } else {
        setSavingLabel('Saving...');
      }

      if (editing?.id) {
        await updatePopup(editing.id, {
          ...form,
          imageUrl: imagePreview,
          oldImageUrl: editing.imageUrl,
        }, imageFile, (p) => setUploadProgress(p));
        toast.success('Popup banner updated.', { className: 'toast-vybera' });
      } else {
        // If no imageFile (local path or URL), pass imageUrl directly
        if (!imageFile) {
          await createPopup({ ...form, imageUrl: imagePreview }, null, null);
        } else {
          await createPopup(form, imageFile, (p) => setUploadProgress(p));
        }
        toast.success('Popup banner created.', { className: 'toast-vybera' });
      }

      closeEditor();
      fetchPopups();
    } catch (err) {
      console.error('[AdminPopup] Save error:', err);
      toast.error(`Error: ${err.message}`, { className: 'toast-vybera' });
    } finally {
      setSaving(false);
      setSavingLabel('');
    }
  };

  const handleDelete = async (popup) => {
    try {
      await deletePopup(popup.id);
      toast.success('Popup deleted.', { className: 'toast-vybera' });
      setDeleteConfirm(null);
      fetchPopups();
    } catch {
      toast.error('Failed to delete popup.', { className: 'toast-vybera' });
    }
  };

  const handleToggle = async (popup) => {
    try {
      await togglePopupActive(popup.id, !popup.isActive);
      setPopups(prev => prev.map(p => p.id === popup.id ? { ...p, isActive: !p.isActive } : p));
      toast.success(`Popup ${popup.isActive ? 'disabled' : 'enabled'}.`, { className: 'toast-vybera' });
    } catch {
      toast.error('Failed to update.', { className: 'toast-vybera' });
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
          <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white flex items-center gap-3">
            <Megaphone size={22} className="text-vy-accent" />
            Popup Banners
          </h1>
        </div>
        <button onClick={() => openEditor()} className="btn-primary flex items-center gap-2 text-xs">
          <Plus size={13} /> New Banner
        </button>
      </div>

      {/* Popups List */}
      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="spinner" /></div>
      ) : popups.length === 0 ? (
        <div className="bg-vy-card border border-vy-border p-16 text-center">
          <Megaphone size={48} className="text-vy-border mx-auto mb-4" />
          <h2 className="text-vy-white font-semibold tracking-wider mb-2">No Popup Banners</h2>
          <p className="text-vy-grey text-sm mb-6">Create a popup to show announcements after user login.</p>
          <button onClick={() => openEditor()} className="btn-primary text-xs">
            Create First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {popups.map(popup => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-vy-card border overflow-hidden transition-all ${
                popup.isActive ? 'border-green-500/30' : 'border-vy-border opacity-60'
              }`}
            >
              {/* Image Preview */}
              <div className="relative aspect-[3/2] bg-vy-black overflow-hidden group">
                <img
                  src={popup.imageUrl || PLACEHOLDER}
                  alt={popup.title || 'Banner'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => { e.target.src = PLACEHOLDER; }}
                />
                {/* Status Badge */}
                <div className={`absolute top-3 left-3 px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase border ${
                  popup.isActive
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : 'bg-red-500/20 border-red-500/30 text-red-400'
                }`}>
                  {popup.isActive ? 'ACTIVE' : 'DISABLED'}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-vy-white text-sm font-semibold tracking-wider mb-1 truncate">
                  {popup.title || 'Untitled Banner'}
                </h3>
                {popup.buttonText && (
                  <div className="flex items-center gap-1.5 text-vy-grey text-xs mb-2">
                    <ExternalLink size={10} />
                    <span className="truncate">{popup.buttonText}</span>
                  </div>
                )}
                <p className="text-vy-border text-[10px] tracking-wider">
                  Created: {popup.createdAt?.toDate?.()?.toLocaleDateString('en-IN') || '—'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex border-t border-vy-border">
                <button
                  onClick={() => handleToggle(popup)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all ${
                    popup.isActive
                      ? 'text-yellow-400 hover:bg-yellow-500/10'
                      : 'text-green-400 hover:bg-green-500/10'
                  }`}
                >
                  {popup.isActive ? <><EyeOff size={12} /> Disable</> : <><Eye size={12} /> Enable</>}
                </button>
                <div className="w-px bg-vy-border" />
                <button
                  onClick={() => openEditor(popup)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-vy-grey text-[10px] font-bold tracking-widest uppercase hover:text-vy-white hover:bg-vy-border/20 transition-all"
                >
                  Edit
                </button>
                <div className="w-px bg-vy-border" />
                <button
                  onClick={() => setDeleteConfirm(popup)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-red-400/60 text-[10px] font-bold tracking-widest uppercase hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Editor Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeEditor}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-vy-dark border border-vy-border w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-vy-border">
                <h2 className="text-vy-white font-semibold tracking-wider flex items-center gap-2">
                  <Megaphone size={16} className="text-vy-accent" />
                  {editing?.id ? 'Edit Popup Banner' : 'New Popup Banner'}
                </h2>
                <button onClick={closeEditor} className="text-vy-grey hover:text-vy-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Image Upload */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-3">Banner Image *</label>

                  {/* Preview */}
                  {imagePreview ? (
                    <div className="relative aspect-[3/2] bg-vy-black border border-vy-border overflow-hidden mb-3 group">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = PLACEHOLDER; }}
                      />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(''); setImageFile(null); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="aspect-[3/2] border-2 border-dashed border-vy-border flex flex-col items-center justify-center cursor-pointer hover:border-vy-accent/50 transition-all bg-vy-card group"
                    >
                      <Upload size={28} className="text-vy-border mb-2 group-hover:text-vy-accent transition-colors" />
                      <p className="text-vy-grey text-xs tracking-wider">Click to upload</p>
                      <p className="text-vy-border text-[10px] mt-1">Auto-compressed to WebP ≤500KB</p>
                    </div>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onFileChange}
                    className="hidden"
                  />

                  {/* Compression Status */}
                  {compressing && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="spinner w-3 h-3" />
                      <span className="text-vy-accent text-[10px] tracking-wider animate-pulse">{savingLabel}</span>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {saving && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-vy-grey tracking-wider">{savingLabel}</span>
                        <span className="text-vy-accent font-bold">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1 bg-vy-border rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-vy-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Compression Complete Info */}
                  {!saving && !compressing && savingLabel && (
                    <p className="text-green-400 text-[10px] mt-2 tracking-wider flex items-center gap-1">
                      <Image size={10} /> {savingLabel}
                    </p>
                  )}

                  {/* ⚡ Quick Pick from Local — INSTANT, zero upload */}
                  <div className="mt-4 border border-vy-border/50 bg-vy-black/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={12} className="text-yellow-400" />
                      <span className="text-yellow-400 text-[10px] font-bold tracking-widest uppercase">Quick Pick — Instant (No Upload)</span>
                    </div>
                    <p className="text-vy-grey text-[10px] mb-3">Click any image from <code className="text-vy-accent">/public/popbanner/</code> — saves path directly, zero buffering.</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        '/popbanner/banner1.webp',
                        '/popbanner/banner1.png',
                        '/popbanner/banner2.webp',
                        '/popbanner/banner2.png',
                        '/popbanner/banner3.webp',
                        '/popbanner/ChatGPT Image May 19, 2026, 10_16_36 AM.png',
                      ].map((path) => (
                        <button
                          key={path}
                          type="button"
                          onClick={() => pickLocalImage(path)}
                          className={`relative h-16 w-24 border overflow-hidden transition-all hover:scale-105 ${
                            imagePreview === path ? 'border-green-400 ring-1 ring-green-400/50' : 'border-vy-border hover:border-vy-accent/50'
                          }`}
                        >
                          <img
                            src={path}
                            alt={path.split('/').pop()}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                          />
                          {imagePreview === path && (
                            <div className="absolute inset-0 bg-green-400/10 flex items-center justify-center">
                              <span className="text-green-400 text-[8px] font-bold">✓</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {/* Direct path input for any local file */}
                    <div className="mt-2 flex gap-2">
                      <input
                        id="local-path-input"
                        className="vy-input text-xs flex-1"
                        placeholder="/popbanner/your-image.png"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = document.getElementById('local-path-input').value;
                          if (val) {
                            pickLocalImage(val.startsWith('/') ? val : `/popbanner/${val}`);
                            document.getElementById('local-path-input').value = '';
                          }
                        }}
                        className="btn-outline px-3 py-1.5 text-[10px] flex items-center gap-1"
                      >
                        <Zap size={10} /> Use
                      </button>
                    </div>
                    <p className="text-vy-border text-[9px] mt-2 flex items-center gap-1">
                      <FolderOpen size={9} /> Drop images into <code>public/popbanner/</code> folder, then type the filename above
                    </p>
                  </div>

                  {/* Alternative: paste any URL */}
                  <div className="mt-3 flex gap-2">
                    <input
                      id="popup-url-input"
                      className="vy-input text-xs flex-1"
                      placeholder="Or paste any image URL"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = document.getElementById('popup-url-input').value;
                        if (val) {
                          pickLocalImage(val);
                          document.getElementById('popup-url-input').value = '';
                        }
                      }}
                      className="btn-outline px-3 py-2 text-xs"
                    >
                      Use URL
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Title (optional)</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="vy-input"
                    placeholder="e.g. Summer Sale — Up to 50% Off"
                  />
                </div>

                {/* Button */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Button Text</label>
                    <input
                      value={form.buttonText}
                      onChange={e => setForm(f => ({ ...f, buttonText: e.target.value }))}
                      className="vy-input"
                      placeholder="Shop Now"
                    />
                  </div>
                  <div>
                    <label className="text-vy-grey text-xs tracking-widest uppercase block mb-2">Button Link</label>
                    <input
                      value={form.buttonLink}
                      onChange={e => setForm(f => ({ ...f, buttonLink: e.target.value }))}
                      className="vy-input"
                      placeholder="/shop or https://..."
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-vy-border rounded-full peer-checked:bg-green-500/50 transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-vy-grey rounded-full peer-checked:translate-x-5 peer-checked:bg-green-400 transition-all duration-200" />
                  </div>
                  <span className="text-vy-grey text-xs tracking-widest uppercase group-hover:text-vy-white transition-colors">
                    {form.isActive ? 'Active — will show after login' : 'Disabled — hidden from users'}
                  </span>
                </label>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeEditor} className="btn-ghost flex-1">Cancel</button>
                  <button
                    onClick={handleSave}
                    disabled={saving || compressing}
                    className="btn-primary flex-1 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="spinner w-3 h-3" /> {savingLabel || 'Saving...'}
                      </span>
                    ) : editing?.id ? 'Update Banner' : 'Create Banner'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ──────────────────────────────────────── */}
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
              <h3 className="text-vy-white font-semibold mb-2 tracking-wider">Delete Popup Banner?</h3>
              <p className="text-vy-grey text-sm mb-6">
                "{deleteConfirm.title || 'Untitled'}" will be permanently removed along with its image.
              </p>
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

export default AdminPopupBanner;
