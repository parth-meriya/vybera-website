import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';
import { getTrustBadges, updateTrustBadges } from '../../firebase/content';

// ── Image Compression Settings ──────────────────────────
const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  fileType: 'image/webp'
};

const AdminContent = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customize, setCustomize] = useState({
    prices: { Front: 700, Back: 700, Both: 900 },
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  });

  const [campaign, setCampaign] = useState({
    active: false,
    name: '',
    discountPercent: 0,
    endDate: ''
  });

  const [trustBadges, setTrustBadges] = useState([]);

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, 'content', 'about')),
      getDoc(doc(db, 'settings', 'customize')),
      getDoc(doc(db, 'settings', 'campaign')),
      getTrustBadges()
    ]).then(([aboutSnap, customSnap, campaignSnap, badges]) => {
      if (aboutSnap.exists()) setText(aboutSnap.data().text || '');
      if (customSnap.exists()) setCustomize(customSnap.data());
      if (campaignSnap.exists()) {
        setCampaign({
          active: false,
          name: '',
          discountPercent: 0,
          endDate: '',
          ...campaignSnap.data()
        });
      }
      setTrustBadges(badges);
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



  const handleSaveCustomize = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'customize'), { 
        ...customize, 
        updatedAt: serverTimestamp() 
      });
      toast.success('Customization settings saved.', { className: 'toast-vybera' });
    } catch {
      toast.error('Failed to save customization settings.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCampaign = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'campaign'), {
        ...campaign,
        discountPercent: Number(campaign.discountPercent) || 0,
        updatedAt: serverTimestamp()
      });
      toast.success('Campaign settings saved.', { className: 'toast-vybera' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save campaign settings.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTrustBadges = async () => {
    setSaving(true);
    try {
      await updateTrustBadges(trustBadges);
      toast.success('Trust badges settings saved.', { className: 'toast-vybera' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save trust badges settings.', { className: 'toast-vybera' });
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
        {/* Left Column: About & Campaign */}
        <div className="space-y-8">
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

          {/* Campaign & Sale Settings */}
          <div className="bg-vy-card border border-vy-border p-6">
            <h2 className="text-vy-white font-semibold text-sm tracking-wider uppercase mb-4 text-vy-accent">Campaign & Sale Settings</h2>
            <p className="text-vy-grey text-xs mb-6 tracking-wide">
              Manage global store-wide sales, discounts, and countdown timers.
            </p>

            {loading ? (
              <div className="h-64 flex items-center justify-center"><div className="spinner" /></div>
            ) : (
              <div className="space-y-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={campaign.active}
                    onChange={e => setCampaign(c => ({ ...c, active: e.target.checked }))}
                    className="w-4 h-4 accent-vy-accent"
                  />
                  <span className="text-vy-white text-xs tracking-widest uppercase font-bold">Enable Global Campaign</span>
                </label>

                <div>
                  <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Campaign Name</label>
                  <input
                    type="text"
                    value={campaign.name}
                    onChange={e => setCampaign(c => ({ ...c, name: e.target.value }))}
                    placeholder="E.g. MIDSEASON SALE"
                    className="vy-input text-sm"
                  />
                </div>

                <div>
                  <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Global Discount Percentage (%)</label>
                  <input
                    type="number"
                    value={campaign.discountPercent}
                    onChange={e => setCampaign(c => ({ ...c, discountPercent: e.target.value }))}
                    placeholder="E.g. 10"
                    min="0"
                    max="100"
                    className="vy-input text-sm"
                  />
                  <p className="text-[10px] text-vy-grey mt-1">Applies to products without custom campaign pricing overrides.</p>
                </div>

                <div>
                  <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Sale End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={campaign.endDate || ''}
                    onChange={e => setCampaign(c => ({ ...c, endDate: e.target.value }))}
                    className="vy-input text-sm"
                  />
                  <p className="text-[10px] text-vy-grey mt-1">Sets the countdown target shown to visitors.</p>
                </div>

                <div className="pt-4 border-t border-vy-border text-right">
                  <button
                    onClick={handleSaveCampaign}
                    disabled={saving || loading}
                    className="btn-primary disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Campaign Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Right Column: Customization & Trust Badges */}
        <div className="space-y-8">
          {/* Customization Settings */}
          <div className="bg-vy-card border border-vy-border p-6">
            <h2 className="text-vy-white font-semibold text-sm tracking-wider uppercase mb-4 text-vy-accent">Studio Settings</h2>
          <p className="text-vy-grey text-xs mb-6 tracking-wide">
            Manage pricing and sizes for the Custom T-Shirt Studio.
          </p>

          {loading ? (
            <div className="h-64 flex items-center justify-center"><div className="spinner" /></div>
          ) : (
            <div className="space-y-8">
              {/* Oversize Prices */}
              <div>
                <label className="text-vy-accent text-[10px] uppercase tracking-widest block mb-4 border-l-2 border-vy-accent pl-2">Oversize Fit Prices</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.keys(customize.oversizePrices || { Front: 700, Back: 700, Both: 900 }).map(pos => (
                    <div key={pos}>
                      <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">{pos}</label>
                      <input 
                        type="number"
                        value={customize.oversizePrices?.[pos] || 0} 
                        onChange={e => setCustomize(c => ({ 
                          ...c, 
                          oversizePrices: { ...(c.oversizePrices || { Front: 700, Back: 700, Both: 900 }), [pos]: parseInt(e.target.value) || 0 } 
                        }))}
                        className="vy-input text-xs" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Regular Prices */}
              <div>
                <label className="text-vy-white text-[10px] uppercase tracking-widest block mb-4 border-l-2 border-vy-white pl-2">Regular Fit Prices</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.keys(customize.regularPrices || { Front: 600, Back: 600, Both: 800 }).map(pos => (
                    <div key={pos}>
                      <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">{pos}</label>
                      <input 
                        type="number"
                        value={customize.regularPrices?.[pos] || 0} 
                        onChange={e => setCustomize(c => ({ 
                          ...c, 
                          regularPrices: { ...(c.regularPrices || { Front: 600, Back: 600, Both: 800 }), [pos]: parseInt(e.target.value) || 0 } 
                        }))}
                        className="vy-input text-xs" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-3">Available Sizes (Global)</label>
                <div className="flex flex-wrap gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        const newSizes = customize.sizes.includes(s)
                          ? customize.sizes.filter(x => x !== s)
                          : [...customize.sizes, s];
                        setCustomize(c => ({ ...c, sizes: newSizes.sort() }));
                      }}
                      className={`px-3 py-1 text-[10px] font-bold border transition-all ${
                        customize.sizes.includes(s)
                          ? 'border-vy-accent bg-vy-accent/10 text-vy-white'
                          : 'border-vy-border text-vy-grey'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-vy-border text-right">
                <button
                  onClick={handleSaveCustomize}
                  disabled={saving || loading}
                  className="btn-primary disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Studio Settings'}
                </button>
              </div>
            </div>
          )}
          </div>

          {/* Trust Badges Settings */}
          <div className="bg-vy-card border border-vy-border p-6">
            <h2 className="text-vy-white font-semibold text-sm tracking-wider uppercase mb-4 text-vy-accent">Trust Badges Settings</h2>
            <p className="text-vy-grey text-xs mb-6 tracking-wide">
              Configure the trust badges shown right below the Add To Cart button on product pages.
            </p>

            {loading ? (
              <div className="h-64 flex items-center justify-center"><div className="spinner" /></div>
            ) : (
              <div className="space-y-6">
                {trustBadges.map((badge, idx) => (
                  <div key={idx} className="p-4 bg-vy-black/40 border border-vy-border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-vy-white text-xs font-bold uppercase tracking-wider">Badge #{idx + 1}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={badge.active}
                          onChange={e => {
                            const updated = [...trustBadges];
                            updated[idx] = { ...updated[idx], active: e.target.checked };
                            setTrustBadges(updated);
                          }}
                          className="w-3.5 h-3.5 accent-vy-accent"
                        />
                        <span className="text-vy-grey text-[10px] uppercase tracking-widest font-semibold">Active</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-vy-grey text-[9px] uppercase tracking-widest block mb-1">Icon</label>
                        <select
                          value={badge.icon}
                          onChange={e => {
                            const updated = [...trustBadges];
                            updated[idx] = { ...updated[idx], icon: e.target.value };
                            setTrustBadges(updated);
                          }}
                          className="vy-input text-xs"
                        >
                          <option value="Truck">Truck (Delivery)</option>
                          <option value="RotateCcw">RotateCcw (Returns)</option>
                          <option value="ShieldCheck">ShieldCheck (Security)</option>
                          <option value="Award">Award (Quality)</option>
                          <option value="Sparkles">Sparkles (Specialty)</option>
                          <option value="Package">Package (Packaging)</option>
                          <option value="Clock">Clock (Speed/Time)</option>
                          <option value="Heart">Heart (Love/Care)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-vy-grey text-[9px] uppercase tracking-widest block mb-1">Title</label>
                        <input
                          type="text"
                          value={badge.title}
                          onChange={e => {
                            const updated = [...trustBadges];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setTrustBadges(updated);
                          }}
                          className="vy-input text-xs"
                          placeholder="E.g. Free Delivery"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-vy-grey text-[9px] uppercase tracking-widest block mb-1">Description</label>
                      <input
                        type="text"
                        value={badge.description}
                        onChange={e => {
                          const updated = [...trustBadges];
                          updated[idx] = { ...updated[idx], description: e.target.value };
                          setTrustBadges(updated);
                        }}
                        className="vy-input text-xs"
                        placeholder="E.g. On orders over ₹999"
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-vy-border text-right">
                  <button
                    onClick={handleSaveTrustBadges}
                    disabled={saving || loading}
                    className="btn-primary disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Trust Badges'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContent;
