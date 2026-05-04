import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { uploadBanner } from '../../firebase/content';
import toast from 'react-hot-toast';
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';

const AdminContent = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Banner State
  const [banner, setBanner] = useState({
    headline: '',
    subtitle: '',
    imageUrl: '',
    expiryDate: '',
    isActive: false
  });

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, 'content', 'about')),
      getDoc(doc(db, 'settings', 'banner'))
    ]).then(([aboutSnap, bannerSnap]) => {
      if (aboutSnap.exists()) setText(aboutSnap.data().text || '');
      if (bannerSnap.exists()) setBanner(bannerSnap.data());
      setLoading(false);
    });
  }, []);

  const handleSaveAbout = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'content', 'about'), { text, updatedAt: serverTimestamp() });
      toast.success('About content saved.', { className: 'toast-vybera' });
    } catch {
      toast.error('Failed to save.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadBanner(file);
      setBanner(b => ({ ...b, imageUrl: url }));
      toast.success('Banner uploaded.', { className: 'toast-vybera' });
    } catch {
      toast.error('Upload failed.', { className: 'toast-vybera' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBanner = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'banner'), { 
        ...banner, 
        updatedAt: serverTimestamp() 
      });
      toast.success('Banner configuration saved.', { className: 'toast-vybera' });
    } catch {
      toast.error('Failed to save banner.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-vy-grey text-xs tracking-widest uppercase mb-1">Admin</p>
        <h1 className="font-display font-bold text-2xl tracking-wider text-vy-white">Content Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* About Page */}
        <div className="bg-vy-card border border-vy-border p-6">
          <h2 className="text-vy-white font-semibold text-sm tracking-wider uppercase mb-4">About Page</h2>
          <p className="text-vy-grey text-xs mb-6 tracking-wide">
            Edit the content that appears on the About page.
          </p>

          {loading ? (
            <div className="h-64 flex items-center justify-center"><div className="spinner" /></div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={10}
                className="vy-input resize-none w-full text-sm leading-relaxed font-light mb-4"
                placeholder="Write your brand story here..."
              />
              <div className="flex items-center justify-between">
                <span className="text-vy-grey text-xs">{text.length} characters</span>
                <button
                  onClick={handleSaveAbout}
                  disabled={saving || loading}
                  className="btn-primary disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save About'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Hero Banner Section */}
        <div className="bg-vy-card border border-vy-border p-6">
          <h2 className="text-vy-white font-semibold text-sm tracking-wider uppercase mb-4 text-vy-accent">Hero Sale Banner</h2>
          <p className="text-vy-grey text-xs mb-6 tracking-wide">
            Configure the main home page banner. Leave blank to use defaults.
          </p>

          {loading ? (
            <div className="h-64 flex items-center justify-center"><div className="spinner" /></div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Headline</label>
                <input 
                  value={banner.headline} 
                  onChange={e => setBanner(b => ({ ...b, headline: e.target.value }))}
                  className="vy-input" placeholder="e.g. SUMMER SALE" 
                />
              </div>
              <div>
                <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Subtitle</label>
                <input 
                  value={banner.subtitle} 
                  onChange={e => setBanner(b => ({ ...b, subtitle: e.target.value }))}
                  className="vy-input" placeholder="e.g. Up to 40% Off" 
                />
              </div>
              <div>
                <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Banner Image</label>
                <div className="space-y-4">
                  {banner.imageUrl ? (
                    <div className="relative aspect-[21/9] bg-vy-dark border border-vy-border overflow-hidden group">
                      <img 
                        src={banner.imageUrl} 
                        alt="Banner Preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="cursor-pointer p-2 bg-vy-white text-vy-black rounded-full hover:scale-110 transition-transform">
                          <Upload size={16} />
                          <input type="file" onChange={handleBannerUpload} className="hidden" accept="image/*" />
                        </label>
                        <button 
                          onClick={() => setBanner(b => ({ ...b, imageUrl: '' }))}
                          className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-[21/9] border border-dashed border-vy-border hover:border-vy-grey cursor-pointer transition-colors">
                      {uploading ? (
                        <Loader2 className="animate-spin text-vy-grey" size={24} />
                      ) : (
                        <>
                          <ImageIcon className="text-vy-border mb-2" size={24} />
                          <span className="text-vy-grey text-[10px] uppercase tracking-widest">Click to upload banner</span>
                        </>
                      )}
                      <input type="file" onChange={handleBannerUpload} className="hidden" accept="image/*" disabled={uploading} />
                    </label>
                  )}
                  <p className="text-vy-grey text-[9px] italic">Recommended size: 1920x800px. Max 5MB.</p>
                </div>
              </div>
              <div>
                <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Expiry Date (Sale End)</label>
                <input 
                  type="date"
                  value={banner.expiryDate} 
                  onChange={e => setBanner(b => ({ ...b, expiryDate: e.target.value }))}
                  className="vy-input" 
                />
                <p className="text-vy-grey text-[9px] mt-2 italic">After this date, the home page will revert to the default branding.</p>
              </div>
              
              <div className="flex items-center gap-4 pt-4 border-t border-vy-border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={banner.isActive} 
                    onChange={e => setBanner(b => ({ ...b, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-vy-accent"
                  />
                  <span className="text-vy-white text-xs uppercase tracking-widest">Enable Sale Banner</span>
                </label>
                <button
                  onClick={handleSaveBanner}
                  disabled={saving || loading}
                  className="btn-primary ml-auto disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminContent;
