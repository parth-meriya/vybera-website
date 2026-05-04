import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

const AdminContent = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
                <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Banner Image URL</label>
                <div className="flex gap-4 items-start">
                  <input 
                    value={banner.imageUrl} 
                    onChange={e => setBanner(b => ({ ...b, imageUrl: e.target.value }))}
                    className="vy-input flex-1" placeholder="https://..." 
                  />
                  {banner.imageUrl && (
                    <div className="w-16 h-16 bg-vy-dark border border-vy-border overflow-hidden">
                      <img 
                        src={banner.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
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
