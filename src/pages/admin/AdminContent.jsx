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
  const [aboutData, setAboutData] = useState({
    text: '',
    brandStory: '',
    founderName: '',
    founderQuote: '',
    brandMission: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customize, setCustomize] = useState({
    prices: { Front: 700, Back: 700, Both: 900 },
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: []
  });

  // New color form state
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#0A0A0A');

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
      if (aboutSnap.exists()) {
        const d = aboutSnap.data();
        setAboutData({
          text: '',
          brandStory: '',
          founderName: '',
          founderQuote: '',
          brandMission: '',
          imageUrl: '',
          ...d,
          brandStory: d.brandStory || d.text || ''
        });
      }
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
      await setDoc(doc(db, 'content', 'about'), { 
        text: aboutData.brandStory || aboutData.text || '',
        ...aboutData, 
        updatedAt: serverTimestamp() 
      });
      toast.success('About page content saved.', { className: 'toast-vybera' });
    } catch {
      toast.error('Failed to save About page content.', { className: 'toast-vybera' });
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
          {/* About Page CMS */}
          <div className="bg-vy-card border border-vy-border p-6">
            <h2 className="text-vy-white font-semibold text-sm tracking-wider uppercase mb-4 text-vy-accent">About Page CMS</h2>
            <p className="text-vy-grey text-xs mb-6 tracking-wide">
              Manage founder details, brand story, and mission.
            </p>

            {loading ? (
              <div className="h-64 flex items-center justify-center"><div className="spinner" /></div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Founder Name</label>
                  <input
                    type="text"
                    value={aboutData.founderName}
                    onChange={e => setAboutData(d => ({ ...d, founderName: e.target.value }))}
                    placeholder="E.g. Parth Meriya"
                    className="vy-input text-sm"
                  />
                </div>

                <div>
                  <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Brand Mission / Tagline</label>
                  <input
                    type="text"
                    value={aboutData.brandMission}
                    onChange={e => setAboutData(d => ({ ...d, brandMission: e.target.value }))}
                    placeholder="E.g. Born from an obsession with forward-thinking clothing."
                    className="vy-input text-sm"
                  />
                </div>

                <div>
                  <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Founder Quote</label>
                  <textarea
                    value={aboutData.founderQuote}
                    onChange={e => setAboutData(d => ({ ...d, founderQuote: e.target.value }))}
                    placeholder="E.g. We don't build clothing, we build vibes."
                    rows={2}
                    className="vy-input resize-none w-full text-sm leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Brand Story</label>
                  <textarea
                    value={aboutData.brandStory}
                    onChange={e => setAboutData(d => ({ ...d, brandStory: e.target.value }))}
                    rows={8}
                    className="vy-input resize-none w-full text-sm leading-relaxed"
                    placeholder="Write the full brand story..."
                  />
                </div>

                <div>
                  <label className="text-vy-grey text-[10px] uppercase tracking-widest block mb-2">Banner Image URL</label>
                  <input
                    type="text"
                    value={aboutData.imageUrl}
                    onChange={e => setAboutData(d => ({ ...d, imageUrl: e.target.value }))}
                    placeholder="E.g. https://images.unsplash.com/..."
                    className="vy-input text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-vy-border text-right">
                  <button
                    onClick={handleSaveAbout}
                    disabled={saving || loading}
                    className="btn-primary disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save About Page Content'}
                  </button>
                </div>
              </div>
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

              {/* T-Shirt Colors Management */}
              <div>
                <label className="text-vy-accent text-[10px] uppercase tracking-widest block mb-4 border-l-2 border-vy-accent pl-2">T-Shirt Color Presets</label>
                <p className="text-vy-grey text-[10px] mb-4">These colors appear as selectable swatches in the customer T-Shirt Studio.</p>

                {/* Existing Colors */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(customize.colors || []).map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-vy-black/40 border border-vy-border px-2.5 py-1.5 group">
                      <div className="w-4 h-4 border border-vy-border/60" style={{ backgroundColor: c.hex }} />
                      <span className="text-[10px] text-vy-light tracking-wide">{c.name}</span>
                      <button
                        onClick={() => {
                          setCustomize(prev => ({
                            ...prev,
                            colors: prev.colors.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="text-red-400/60 hover:text-red-400 transition-colors text-[10px] font-bold ml-1"
                        title="Remove color"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {(!customize.colors || customize.colors.length === 0) && (
                    <p className="text-vy-grey text-[10px] italic">No colors configured yet. Using default presets on the studio page.</p>
                  )}
                </div>

                {/* Add New Color */}
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-vy-grey text-[9px] uppercase tracking-widest block mb-1">Color Name</label>
                    <input
                      type="text"
                      value={newColorName}
                      onChange={e => setNewColorName(e.target.value)}
                      placeholder="e.g. Acid Wash Grey"
                      className="vy-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="text-vy-grey text-[9px] uppercase tracking-widest block mb-1">Hex</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={newColorHex}
                        onChange={e => setNewColorHex(e.target.value)}
                        className="w-8 h-8 cursor-pointer border border-vy-border bg-transparent"
                      />
                      <input
                        type="text"
                        value={newColorHex}
                        onChange={e => setNewColorHex(e.target.value)}
                        className="vy-input text-xs w-20"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!newColorName.trim()) return;
                      setCustomize(prev => ({
                        ...prev,
                        colors: [...(prev.colors || []), { name: newColorName.trim(), hex: newColorHex }]
                      }));
                      setNewColorName('');
                      setNewColorHex('#0A0A0A');
                    }}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-vy-accent text-vy-accent hover:bg-vy-accent/10 transition-all"
                  >
                    + Add Color
                  </button>
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
