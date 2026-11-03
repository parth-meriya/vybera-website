import { useEffect, useState, useRef, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { uploadBanner, uploadMusic } from '../../firebase/content';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Music, Loader2, Crop, Scissors, Zap, FolderOpen, Image as ImageIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import toast from 'react-hot-toast';

// ── Crop Helper ────────────
const getCroppedImg = (imageSrc, croppedAreaPixels) => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0,
        croppedAreaPixels.width, croppedAreaPixels.height
      );
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);
          resolve(new File([blob], `mainbanner_cropped_${Date.now()}.webp`, {
            type: 'image/webp', lastModified: Date.now(),
          }));
        },
        'image/webp',
        0.85 // High quality for main banner
      );
    };
    img.onerror = () => resolve(null);
  });
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const ASPECT_OPTIONS = [
  { label: '9:16 Mobile', value: 9 / 16 },
  { label: '16:9 Desktop', value: 16 / 9 },
  { label: '4:5 Portrait', value: 4 / 5 },
  { label: 'Free', value: undefined },
];

const compressImageFast = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.size < 500 * 1024) {
      return resolve(file);
    }
    setTimeout(async () => {
      try {
        const MAX_W = 1200; // Main banner width
        const bitmap = await createImageBitmap(file, {
          resizeWidth: MAX_W,
          resizeQuality: 'high',
        });
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(webpFile);
          },
          'image/webp',
          0.7
        );
      } catch (err) {
        console.error('Fast compression error:', err);
        resolve(file);
      }
    }, 0);
  });
};

const AdminMainBanner = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [musicProgress, setMusicProgress] = useState(0);
  const [savingLabel, setSavingLabel] = useState('');

  // Banner State
  const [banner, setBanner] = useState({
    headline: '',
    subtitle: '',
    imageUrl: '',
    expiryDate: '',
    isActive: false,
    musicUrl: '',
    musicEnabled: false
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Crop state
  const [showCrop, setShowCrop] = useState(false);
  const [cropImage, setCropImage] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropAspect, setCropAspect] = useState(9 / 16);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    getDoc(doc(db, 'settings', 'banner')).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBanner(data);
        if (data.imageUrl) setImagePreview(data.imageUrl);
      }
      setLoading(false);
    });
  }, []);

  const pickLocalImage = (path) => {
    setImagePreview(path);
    setImageFile(null); // No file to upload
    setBanner(b => ({ ...b, imageUrl: path }));
    setSavingLabel('Using local image — instant save!');
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';

    const url = URL.createObjectURL(file);
    setCropImage(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setShowCrop(true);
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !cropImage) return;

    setSavingLabel('Cropping...');
    setUploading(true);
    setShowCrop(false);

    const croppedFile = await getCroppedImg(cropImage, croppedAreaPixels);
    if (!croppedFile) {
      toast.error('Crop failed.', { className: 'toast-vybera' });
      setUploading(false);
      return;
    }

    setImagePreview(URL.createObjectURL(croppedFile));

    if (croppedFile.size > 500 * 1024) {
      setSavingLabel(`Optimizing ${formatBytes(croppedFile.size)}...`);
      compressImageFast(croppedFile).then((compressed) => {
        setImageFile(compressed);
        setUploading(false);
        const ratio = ((1 - compressed.size / croppedFile.size) * 100).toFixed(0);
        setSavingLabel(`Ready — ${formatBytes(compressed.size)} (${ratio}% reduced)`);
      });
    } else {
      setImageFile(croppedFile);
      setUploading(false);
      setSavingLabel(`Ready — ${formatBytes(croppedFile.size)}`);
    }
  };

  const handleMusicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.includes('audio/mpeg') && !file.type.includes('audio/mp3')) {
      toast.error('Please upload an MP3 file.', { className: 'toast-vybera' });
      return;
    }
    setUploadingMusic(true);
    setMusicProgress(0);
    try {
      const url = await uploadMusic(file, (pct) => setMusicProgress(pct));
      setBanner(b => ({ ...b, musicUrl: url }));
      toast.success('Music uploaded successfully.', { className: 'toast-vybera' });
    } catch {
      toast.error('Music upload failed.', { className: 'toast-vybera' });
    } finally {
      setUploadingMusic(false);
      setMusicProgress(0);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalImageUrl = banner.imageUrl;
      
      // If there's a new file, upload to Firebase Storage
      if (imageFile) {
        setSavingLabel('Uploading to Storage...');
        finalImageUrl = await uploadBanner(imageFile);
      } else if (imagePreview && !imagePreview.startsWith('blob:')) {
        // Must be a Quick Pick local path or existing URL
        finalImageUrl = imagePreview;
      }

      await setDoc(doc(db, 'settings', 'banner'), { 
        ...banner, 
        imageUrl: finalImageUrl,
        updatedAt: serverTimestamp() 
      });
      setBanner(b => ({ ...b, imageUrl: finalImageUrl }));
      setImageFile(null); // clear file after upload
      toast.success('Main banner saved successfully.', { className: 'toast-vybera' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
      setSavingLabel('');
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="spinner" /></div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <p className="text-[#75665C] text-xs tracking-widest uppercase font-bold mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl tracking-wider text-[#30231F]">Main Banner Manager</h1>
      </div>

      <div className="bg-[#FAF5ED] border border-[#D4BEA5] rounded-2xl p-6 md:p-8 space-y-8 shadow-sm">
        {/* Basic Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-[#75665C] text-xs font-bold uppercase tracking-widest block mb-2">Headline</label>
            <input 
              value={banner.headline} 
              onChange={e => setBanner(b => ({ ...b, headline: e.target.value }))}
              className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#590907]" placeholder="e.g. SUMMER SALE" 
            />
          </div>
          <div>
            <label className="text-[#75665C] text-xs font-bold uppercase tracking-widest block mb-2">Subtitle</label>
            <input 
              value={banner.subtitle} 
              onChange={e => setBanner(b => ({ ...b, subtitle: e.target.value }))}
              className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#590907]" placeholder="e.g. Up to 40% Off" 
            />
          </div>
        </div>

        {/* Image Upload / Crop / Quick Pick */}
        <div>
          <label className="text-[#75665C] text-xs font-bold uppercase tracking-widest block mb-2">Banner Image *</label>
          {imagePreview ? (
            <div className="relative aspect-[9/16] md:aspect-[16/9] max-w-lg bg-white border border-[#D4BEA5] rounded-xl overflow-hidden mb-3 group shadow-sm">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  type="button"
                  onClick={() => {
                      setCropImage(imagePreview);
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                      setShowCrop(true);
                    }}
                    className="w-8 h-8 bg-black/60 rounded flex items-center justify-center text-white hover:bg-black transition-all"
                  >
                    <Crop size={14} />
                  </button>
                <button
                  type="button"
                  onClick={() => { setImagePreview(''); setImageFile(null); setBanner(b => ({ ...b, imageUrl: '' })); }}
                  className="w-8 h-8 bg-black/60 rounded flex items-center justify-center text-white/80 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="aspect-[16/9] max-w-lg border-2 border-dashed border-[#D4BEA5] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#590907] transition-all bg-white group"
            >
              <Upload size={28} className="text-[#75665C] mb-2 group-hover:text-[#590907] transition-colors" />
              <p className="text-[#30231F] text-xs font-semibold tracking-wider">Click to upload & crop</p>
              <p className="text-[#75665C] text-[10px] mt-1">Default crop ratio is 9:16 (Mobile)</p>
            </div>
          )}
          
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />

          {uploading && (
            <div className="mt-3 flex items-center gap-2">
              <div className="spinner w-3 h-3" />
              <span className="text-[#590907] text-[10px] tracking-wider animate-pulse font-bold">{savingLabel}</span>
            </div>
          )}
          {!uploading && !saving && savingLabel && (
            <p className="text-emerald-700 text-[10px] mt-2 tracking-wider flex items-center gap-1 font-semibold">
              <ImageIcon size={10} /> {savingLabel}
            </p>
          )}

          {/* Quick Pick (Local) */}
          <div className="mt-4 border border-[#D4BEA5] bg-[#F3E7D8]/50 rounded-xl p-4 max-w-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-amber-700" />
              <span className="text-amber-900 text-[10px] font-bold tracking-widest uppercase">Quick Pick (No Upload)</span>
            </div>
            <p className="text-[#75665C] text-[10px] mb-3">Select from <code className="text-[#590907] font-semibold">/public/mainbanner/</code>.</p>
            <div className="flex flex-wrap gap-2">
              {[
                '/mainbanner/anniversary_banner.png',
                '/hero_banner.png',
                '/anniversary_manual.png'
              ].map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => pickLocalImage(path)}
                  className={`relative h-20 w-14 border rounded-lg overflow-hidden transition-all hover:scale-105 shadow-sm ${
                    imagePreview === path ? 'border-[#590907] ring-2 ring-[#590907]' : 'border-[#D4BEA5] hover:border-[#590907]'
                  }`}
                >
                  <img
                    src={path}
                    alt="QuickPick"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                  />
                  {imagePreview === path && (
                    <div className="absolute inset-0 bg-[#590907]/20 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                id="local-mainbanner-input"
                className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                placeholder="/mainbanner/your-image.png"
              />
              <button
                type="button"
                onClick={() => {
                  const val = document.getElementById('local-mainbanner-input').value;
                  if (val) {
                    pickLocalImage(val.startsWith('/') ? val : `/mainbanner/${val}`);
                    document.getElementById('local-mainbanner-input').value = '';
                  }
                }}
                className="btn-primary px-3 py-1.5 text-[10px]"
              >
                Use
              </button>
            </div>
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label className="text-[#75665C] text-xs font-bold uppercase tracking-widest block mb-2">Expiry Date (Sale End)</label>
          <input 
            type="date"
            value={banner.expiryDate} 
            onChange={e => setBanner(b => ({ ...b, expiryDate: e.target.value }))}
            className="w-full bg-white border border-[#D4BEA5] text-[#30231F] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#590907]" 
          />
          <p className="text-[#75665C] text-xs mt-2 italic font-medium">After this date, the home page will revert to the default branding.</p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-[#D4BEA5]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={banner.isActive} 
              onChange={e => setBanner(b => ({ ...b, isActive: e.target.checked }))}
              className="w-4 h-4 accent-[#590907]"
            />
            <span className="text-[#30231F] text-xs font-bold uppercase tracking-widest">Set as Active</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setBanner({ headline: '', subtitle: '', imageUrl: '', expiryDate: '', isActive: false, musicUrl: '', musicEnabled: false });
                setImagePreview('');
                setImageFile(null);
                toast.success('Cleared. Click Save to reset site.', { className: 'toast-vybera' });
              }}
              className="px-4 py-2 border border-[#D4BEA5] bg-white rounded-lg text-[#75665C] text-xs uppercase tracking-widest font-semibold hover:text-[#590907]"
            >
              Reset
            </button>
            <button onClick={handleSave} disabled={saving || uploading} className="btn-primary flex gap-2 items-center text-xs py-2 px-5 font-bold uppercase tracking-widest">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Crop Modal ── */}
      <AnimatePresence>
        {showCrop && cropImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-vy-dark border-b border-vy-border">
              <div className="flex items-center gap-2">
                <Scissors size={16} className="text-vy-accent" />
                <span className="text-vy-white text-sm font-semibold tracking-wider">Crop Main Banner</span>
              </div>
              <button onClick={() => setShowCrop(false)} className="text-vy-grey hover:text-vy-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 relative">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                cropShape="rect"
                showGrid={true}
                style={{
                  containerStyle: { background: '#0a0a0a' },
                  cropAreaStyle: { border: '2px solid rgba(183, 142, 92, 0.6)' },
                }}
              />
            </div>

            <div className="px-4 py-3 bg-vy-dark border-t border-vy-border space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-vy-grey text-[10px] tracking-widest uppercase w-16">Ratio</span>
                <div className="flex gap-1.5">
                  {ASPECT_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setCropAspect(opt.value)}
                      className={`px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase border transition-all ${
                        cropAspect === opt.value
                          ? 'border-vy-accent bg-vy-accent/20 text-vy-accent'
                          : 'border-vy-border text-vy-grey hover:border-vy-grey'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-vy-grey text-[10px] tracking-widest uppercase w-16">Zoom</span>
                <input
                  type="range"
                  min={1} max={3} step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-[#B78E5C] h-1 cursor-pointer"
                />
                <span className="text-vy-accent text-xs font-mono w-10 text-right">{zoom.toFixed(1)}x</span>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCrop(false)} className="btn-ghost flex-1 text-xs">
                  Cancel
                </button>
                <button type="button" onClick={handleCropConfirm} className="btn-primary flex-1 text-xs flex items-center justify-center gap-2">
                  <Crop size={13} /> Apply Crop
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMainBanner;
