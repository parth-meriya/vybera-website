import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  Save,
  Eye,
  Calendar,
  Sparkles,
  Upload,
  Percent,
  Check,
  AlertCircle,
  Smartphone,
  Monitor,
  X,
  ExternalLink,
  Layers,
  Clock,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getDiwaliCampaign,
  updateDiwaliCampaign,
  uploadDiwaliBanner,
  isCampaignActive,
  DEFAULT_DIWALI_CAMPAIGN,
} from '../../firebase/diwaliCampaign';
import { getProducts } from '../../firebase/products';
import { getShoppableVideos, updateShoppableVideos } from '../../firebase/shoppableVideos';
import BackButton from '../../components/ui/BackButton';

const LOCAL_PRESETS = [
  { label: 'Hero Banner (Default)', path: '/hero_banner.png' },
  { label: 'Anniversary Campaign', path: '/mainbanner/anniversary_banner.png' },
  { label: 'Editorial Model 01', path: '/Design/7th%20boy/ChatGPT%20Image%20May%204,%202026,%2010_07_57%20AM.png' },
  { label: 'Editorial Model 02', path: '/Design/6th%20girl/ChatGPT%20Image%20May%204,%202026,%2009_39_33%20AM.png' },
  { label: 'Couple Editorial', path: '/Design/couple/ChatGPT%20Image%20May%204,%202026,%2010_42_48%20AM.png' },
];

const AdminDiwaliCampaign = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [campaign, setCampaign] = useState(DEFAULT_DIWALI_CAMPAIGN);
  const [products, setProducts] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'

  const [activeTab, setActiveTab] = useState('diwali'); // 'diwali' | 'videos'
  const [videos, setVideos] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);

  const desktopFileRef = useRef(null);
  const mobileFileRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getDiwaliCampaign(),
      getProducts().catch(() => []),
      getShoppableVideos().catch(() => []),
    ]).then(([campData, prods, vids]) => {
      setCampaign(campData);
      setProducts(prods || []);
      setVideos(vids || []);
      setLoading(false);
    });
  }, []);

  const handleSaveCampaign = async () => {
    setSaving(true);
    try {
      await updateDiwaliCampaign(campaign);
      toast.success('Diwali Campaign saved and published successfully!', {
        className: 'toast-vybera',
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save campaign.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  const handleDesktopUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDesktop(true);
    try {
      const url = await uploadDiwaliBanner(file, 'desktop');
      setCampaign((prev) => ({ ...prev, desktopBannerUrl: url }));
      toast.success('Desktop banner uploaded!', { className: 'toast-vybera' });
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. You can also paste an image URL.', { className: 'toast-vybera' });
    } finally {
      setUploadingDesktop(false);
    }
  };

  const handleMobileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMobile(true);
    try {
      const url = await uploadDiwaliBanner(file, 'mobile');
      setCampaign((prev) => ({ ...prev, mobileBannerUrl: url }));
      toast.success('Mobile banner uploaded!', { className: 'toast-vybera' });
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. You can also paste an image URL.', { className: 'toast-vybera' });
    } finally {
      setUploadingMobile(false);
    }
  };

  const toggleFeaturedProduct = (id) => {
    setCampaign((prev) => {
      const exists = prev.featuredProductIds?.includes(id);
      const list = exists
        ? prev.featuredProductIds.filter((pId) => pId !== id)
        : [...(prev.featuredProductIds || []), id];
      return { ...prev, featuredProductIds: list };
    });
  };

  const handleSaveVideos = async () => {
    setSaving(true);
    try {
      await updateShoppableVideos(videos);
      toast.success('Shoppable videos updated!', { className: 'toast-vybera' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update shoppable videos.', { className: 'toast-vybera' });
    } finally {
      setSaving(false);
    }
  };

  const activeNow = isCampaignActive(campaign);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-vy-burgundy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-vy-border-light">
        <div>
          <BackButton />
          <div className="flex items-center gap-3 mt-4">
            <span className="p-2.5 bg-vy-burgundy text-[#FAF5ED] rounded-none">
              <Flame size={22} />
            </span>
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-vy-text uppercase">
                Diwali Campaign Manager
              </h1>
              <p className="text-xs text-vy-text-muted mt-0.5 tracking-wider">
                VYBERA FESTIVE STREETWEAR EDITION • CAMPAIGN & HERO CONTROLLER
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="btn-secondary !py-2.5 !px-5"
          >
            <Eye size={15} />
            Live Preview
          </button>
          <button
            type="button"
            onClick={activeTab === 'diwali' ? handleSaveCampaign : handleSaveVideos}
            disabled={saving}
            className="btn-primary !py-2.5 !px-6"
          >
            <Save size={15} />
            {saving ? 'Publishing...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-vy-border-light pb-2">
        <button
          onClick={() => setActiveTab('diwali')}
          className={`pb-2 text-xs font-bold tracking-[0.2em] uppercase transition-all ${
            activeTab === 'diwali'
              ? 'text-vy-burgundy border-b-2 border-vy-burgundy'
              : 'text-vy-text-muted hover:text-vy-text'
          }`}
        >
          Diwali Campaign Setup
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`pb-2 text-xs font-bold tracking-[0.2em] uppercase transition-all ${
            activeTab === 'videos'
              ? 'text-vy-burgundy border-b-2 border-vy-burgundy'
              : 'text-vy-text-muted hover:text-vy-text'
          }`}
        >
          Shoppable Videos (Section 6)
        </button>
      </div>

      {/* Live Status Pill */}
      <div className="mb-8 p-4 bg-[#FAF5ED] border border-vy-border-light flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-3 h-3 rounded-full ${
              activeNow ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-vy-text">
              Status: {activeNow ? 'Campaign LIVE on Homepage' : 'Campaign Inactive / Scheduled / Expired'}
            </div>
            <div className="text-[11px] text-vy-text-muted">
              {campaign.enabled
                ? campaign.endDate
                  ? `Active until ${new Date(campaign.endDate).toLocaleString()}`
                  : 'Active indefinitely (no end date)'
                : 'Disabled by admin switch'}
            </div>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={campaign.enabled}
            onChange={(e) => setCampaign((c) => ({ ...c, enabled: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-vy-sage/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vy-burgundy" />
          <span className="ml-3 text-xs font-bold tracking-wider uppercase text-vy-text">
            {campaign.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {activeTab === 'diwali' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Config Form (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Hero Content */}
            <div className="bg-[#FAF5ED] border border-vy-border-light p-6">
              <h2 className="text-xs font-bold tracking-[0.2em] text-vy-burgundy uppercase mb-4 flex items-center gap-2">
                <Sparkles size={14} /> Campaign Copy & Messaging
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                    Hero Badge / Eyebrow Text
                  </label>
                  <input
                    type="text"
                    value={campaign.badgeText || ''}
                    onChange={(e) => setCampaign((c) => ({ ...c, badgeText: e.target.value }))}
                    placeholder="DIWALI FESTIVE EDITION"
                    className="vy-input"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={campaign.headline || ''}
                    onChange={(e) => setCampaign((c) => ({ ...c, headline: e.target.value }))}
                    placeholder="DIWALI VIBES. BIGGER DROPS. BETTER DEALS."
                    className="vy-input font-bold"
                  />
                  <p className="text-[10px] text-vy-text-muted mt-1">
                    Editorial fashion headline displayed prominently on the hero banner.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                    Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={campaign.subtitle || ''}
                    onChange={(e) => setCampaign((c) => ({ ...c, subtitle: e.target.value }))}
                    placeholder="Celebrate the festival of lights with your favourite VYBERA fits."
                    className="vy-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={campaign.ctaText || 'SHOP DIWALI SALE'}
                      onChange={(e) => setCampaign((c) => ({ ...c, ctaText: e.target.value }))}
                      className="vy-input font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                      CTA Link Destination
                    </label>
                    <input
                      type="text"
                      value={campaign.ctaLink || '/shop'}
                      onChange={(e) => setCampaign((c) => ({ ...c, ctaLink: e.target.value }))}
                      placeholder="/shop"
                      className="vy-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Banner Imagery */}
            <div className="bg-[#FAF5ED] border border-vy-border-light p-6">
              <h2 className="text-xs font-bold tracking-[0.2em] text-vy-burgundy uppercase mb-4 flex items-center gap-2">
                <Monitor size={14} /> Desktop & Mobile Campaign Banners
              </h2>

              <div className="space-y-6">
                {/* Desktop Banner */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-vy-text">
                      Desktop Banner Image URL (16:9 / Wide)
                    </label>
                    <input
                      type="file"
                      ref={desktopFileRef}
                      onChange={handleDesktopUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => desktopFileRef.current?.click()}
                      disabled={uploadingDesktop}
                      className="text-[10px] font-bold tracking-wider uppercase text-vy-burgundy hover:underline flex items-center gap-1"
                    >
                      <Upload size={12} />
                      {uploadingDesktop ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={campaign.desktopBannerUrl || ''}
                    onChange={(e) =>
                      setCampaign((c) => ({ ...c, desktopBannerUrl: e.target.value }))
                    }
                    placeholder="/hero_banner.png"
                    className="vy-input text-xs"
                  />

                  {/* Preset quick picks */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-[10px] text-vy-text-muted self-center">Presets:</span>
                    {LOCAL_PRESETS.map((p) => (
                      <button
                        key={p.path}
                        type="button"
                        onClick={() => setCampaign((c) => ({ ...c, desktopBannerUrl: p.path }))}
                        className="text-[10px] px-2 py-0.5 bg-vy-cream border border-vy-border-light text-vy-text hover:border-vy-burgundy transition-all"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {campaign.desktopBannerUrl && (
                    <div className="mt-3 aspect-[16/7] w-full max-h-48 overflow-hidden border border-vy-border-light bg-black">
                      <img
                        src={campaign.desktopBannerUrl}
                        alt="Desktop Banner Preview"
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          e.target.src = '/hero_banner.png';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Mobile Banner */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold tracking-wider uppercase text-vy-text">
                      Mobile Banner Image URL (Portrait / 9:16)
                    </label>
                    <input
                      type="file"
                      ref={mobileFileRef}
                      onChange={handleMobileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => mobileFileRef.current?.click()}
                      disabled={uploadingMobile}
                      className="text-[10px] font-bold tracking-wider uppercase text-vy-burgundy hover:underline flex items-center gap-1"
                    >
                      <Upload size={12} />
                      {uploadingMobile ? 'Uploading...' : 'Upload Mobile Image'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={campaign.mobileBannerUrl || ''}
                    onChange={(e) =>
                      setCampaign((c) => ({ ...c, mobileBannerUrl: e.target.value }))
                    }
                    placeholder="/hero_banner.png (leave same or custom portrait)"
                    className="vy-input text-xs"
                  />
                  <p className="text-[10px] text-vy-text-muted mt-1">
                    Optimized portrait crop for mobile screens. If empty, desktop banner will be used with object-cover.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Featured Products Selector */}
            <div className="bg-[#FAF5ED] border border-vy-border-light p-6">
              <h2 className="text-xs font-bold tracking-[0.2em] text-vy-burgundy uppercase mb-2 flex items-center gap-2">
                <Layers size={14} /> Diwali Featured Products ({campaign.featuredProductIds?.length || 0} selected)
              </h2>
              <p className="text-[11px] text-vy-text-muted mb-4">
                Select products to spotlight directly in the Diwali drops and bestseller showcase.
              </p>

              {products.length === 0 ? (
                <p className="text-xs text-vy-text-muted italic">No products found in database yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-2 border border-vy-border-light bg-white">
                  {products.map((p) => {
                    const selected = campaign.featuredProductIds?.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleFeaturedProduct(p.id)}
                        className={`text-left p-2 border transition-all relative ${
                          selected
                            ? 'border-vy-burgundy bg-vy-burgundy/5'
                            : 'border-vy-border-light hover:border-vy-sage'
                        }`}
                      >
                        <div className="aspect-[3/4] bg-vy-cream mb-2 overflow-hidden relative">
                          <img
                            src={p.images?.[0] || p.image || '/hero.png'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                          {selected && (
                            <span className="absolute top-1 right-1 bg-vy-burgundy text-white p-0.5 rounded-full">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-vy-text truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-vy-burgundy font-bold">
                          ₹{p.price}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Schedule & Discount Settings */}
          <div className="space-y-6">
            {/* Discount Configuration */}
            <div className="bg-[#FAF5ED] border border-vy-border-light p-6">
              <h2 className="text-xs font-bold tracking-[0.2em] text-vy-burgundy uppercase mb-4 flex items-center gap-2">
                <Percent size={14} /> Discount Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                    Storewide Campaign Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={campaign.discountPercent ?? 0}
                    onChange={(e) =>
                      setCampaign((c) => ({
                        ...c,
                        discountPercent: Math.max(0, parseInt(e.target.value) || 0),
                      }))
                    }
                    className="vy-input font-bold"
                  />
                  <p className="text-[10px] text-vy-text-muted mt-1">
                    Set to 0 if individual products have their own sale prices or if using coupon codes.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                    Recommended Coupon Code
                  </label>
                  <input
                    type="text"
                    value={campaign.discountCode || ''}
                    onChange={(e) =>
                      setCampaign((c) => ({ ...c, discountCode: e.target.value.toUpperCase() }))
                    }
                    placeholder="DIWALI"
                    className="vy-input uppercase font-bold tracking-widest"
                  />
                  <p className="text-[10px] text-vy-text-muted mt-1">
                    Customer can apply this at checkout for festive discounts.
                  </p>
                </div>
              </div>
            </div>

            {/* Campaign Scheduling */}
            <div className="bg-[#FAF5ED] border border-vy-border-light p-6">
              <h2 className="text-xs font-bold tracking-[0.2em] text-vy-burgundy uppercase mb-4 flex items-center gap-2">
                <Calendar size={14} /> Automated Schedule & Countdown
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                    Campaign Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      campaign.startDate
                        ? new Date(campaign.startDate).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setCampaign((c) => ({
                        ...c,
                        startDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                      }))
                    }
                    className="vy-input text-xs"
                  />
                  <p className="text-[10px] text-vy-text-muted mt-1">
                    Leave blank to activate immediately when enabled.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-vy-text mb-1.5">
                    Campaign End Date & Time (Expiration)
                  </label>
                  <input
                    type="datetime-local"
                    value={
                      campaign.endDate
                        ? new Date(campaign.endDate).toISOString().slice(0, 16)
                        : ''
                    }
                    onChange={(e) =>
                      setCampaign((c) => ({
                        ...c,
                        endDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                      }))
                    }
                    className="vy-input text-xs"
                  />
                  <p className="text-[10px] text-vy-text-muted mt-1">
                    When this time is reached, the hero automatically reverts to default brand messaging!
                  </p>
                </div>

                <div className="pt-2 border-t border-vy-border-light">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={campaign.showCountdown !== false}
                      onChange={(e) =>
                        setCampaign((c) => ({ ...c, showCountdown: e.target.checked }))
                      }
                      className="w-4 h-4 text-vy-burgundy focus:ring-vy-burgundy accent-vy-burgundy"
                    />
                    <div>
                      <span className="text-xs font-bold tracking-wider uppercase text-vy-text">
                        Display Countdown Timer
                      </span>
                      <p className="text-[10px] text-vy-text-muted">
                        Shows festive countdown on homepage while end date is active.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Rules & Guidelines */}
            <div className="p-4 bg-vy-cream/60 border border-vy-border-light text-vy-text text-xs space-y-2">
              <div className="font-bold tracking-wider uppercase text-vy-burgundy flex items-center gap-1.5">
                <AlertCircle size={14} /> Checkout Safety
              </div>
              <p className="text-[11px] leading-relaxed text-vy-text-muted">
                Discount percentage applies safely through existing pricing utility. Razorpay payment integration, coupon validations, and tax/shipping rules remain untouched.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Shoppable Videos Admin Tab */
        <div className="bg-[#FAF5ED] border border-vy-border-light p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold tracking-[0.2em] text-vy-burgundy uppercase flex items-center gap-2">
                <Video size={16} /> Shoppable Streetwear Videos (Section 6)
              </h2>
              <p className="text-xs text-vy-text-muted mt-1">
                Curate short video reels with product tags and instant "Shop Now" and "Customize" CTAs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newVid = {
                  id: `v_${Date.now()}`,
                  productName: 'New Streetwear Fit',
                  price: 999,
                  compareAtPrice: 1499,
                  thumbnailUrl: '/hero.png',
                  videoUrl: '',
                  shopUrl: '/shop',
                  customizeUrl: '/customize',
                };
                setVideos((prev) => [...prev, newVid]);
              }}
              className="btn-secondary !py-2 !px-4 text-[11px]"
            >
              + Add Shoppable Video
            </button>
          </div>

          <div className="space-y-4">
            {videos.map((vid, idx) => (
              <div
                key={vid.id || idx}
                className="p-4 border border-vy-border-light bg-white grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                <div className="md:col-span-2 aspect-[9/16] max-h-36 bg-vy-cream overflow-hidden border border-vy-border-light relative">
                  <img
                    src={vid.thumbnailUrl || '/hero.png'}
                    alt={vid.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/hero.png';
                    }}
                  />
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/80 text-white px-1.5 py-0.5">
                    Preview
                  </span>
                </div>

                <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-vy-text mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={vid.productName || ''}
                      onChange={(e) => {
                        const updated = [...videos];
                        updated[idx].productName = e.target.value;
                        setVideos(updated);
                      }}
                      className="vy-input !py-1.5 text-xs font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-vy-text mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={vid.price || 0}
                        onChange={(e) => {
                          const updated = [...videos];
                          updated[idx].price = Number(e.target.value);
                          setVideos(updated);
                        }}
                        className="vy-input !py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-vy-text mb-1">
                        Compare (₹)
                      </label>
                      <input
                        type="number"
                        value={vid.compareAtPrice || 0}
                        onChange={(e) => {
                          const updated = [...videos];
                          updated[idx].compareAtPrice = Number(e.target.value);
                          setVideos(updated);
                        }}
                        className="vy-input !py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-vy-text mb-1">
                      Video Stream URL (.mp4 / stream)
                    </label>
                    <input
                      type="text"
                      value={vid.videoUrl || ''}
                      onChange={(e) => {
                        const updated = [...videos];
                        updated[idx].videoUrl = e.target.value;
                        setVideos(updated);
                      }}
                      placeholder="https://...video.mp4"
                      className="vy-input !py-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-vy-text mb-1">
                      Thumbnail Image URL
                    </label>
                    <input
                      type="text"
                      value={vid.thumbnailUrl || ''}
                      onChange={(e) => {
                        const updated = [...videos];
                        updated[idx].thumbnailUrl = e.target.value;
                        setVideos(updated);
                      }}
                      placeholder="/Design/... or https://..."
                      className="vy-input !py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="md:col-span-1 flex md:flex-col items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVideos((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete Video"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSaveVideos}
              disabled={saving}
              className="btn-primary !py-2.5 !px-6"
            >
              <Save size={15} />
              {saving ? 'Saving Videos...' : 'Save Shoppable Videos'}
            </button>
          </div>
        </div>
      )}

      {/* ── LIVE PREVIEW MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#FAF5ED] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-vy-border-light shadow-2xl"
            >
              {/* Preview Bar */}
              <div className="p-4 bg-vy-text text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tracking-widest uppercase text-vy-beige">
                    Diwali Campaign Preview
                  </span>
                  <div className="flex bg-black/40 rounded p-0.5">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1.5 text-xs flex items-center gap-1 ${
                        previewDevice === 'desktop'
                          ? 'bg-vy-burgundy text-white font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Monitor size={14} /> Desktop
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1.5 text-xs flex items-center gap-1 ${
                        previewDevice === 'mobile'
                          ? 'bg-vy-burgundy text-white font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Smartphone size={14} /> Mobile
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Preview Content Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-stone-900/40">
                <div
                  className={`transition-all duration-300 bg-[#FAF5ED] overflow-hidden shadow-lg border border-vy-border-light ${
                    previewDevice === 'mobile'
                      ? 'w-[375px] rounded-2xl min-h-[667px]'
                      : 'w-full max-w-4xl'
                  }`}
                >
                  {/* Hero simulation */}
                  <div className="relative min-h-[480px] flex items-center bg-[#30231F] text-white overflow-hidden p-6 md:p-12">
                    <div className="absolute inset-0 z-0">
                      <img
                        src={
                          previewDevice === 'mobile' && campaign.mobileBannerUrl
                            ? campaign.mobileBannerUrl
                            : campaign.desktopBannerUrl || '/hero_banner.png'
                        }
                        alt="Hero Preview"
                        className="w-full h-full object-cover opacity-60"
                        onError={(e) => {
                          e.target.src = '/hero_banner.png';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#30231F] via-[#30231F]/80 to-transparent" />
                    </div>

                    <div className="relative z-10 max-w-lg">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-vy-burgundy text-[#FAF5ED] text-[10px] font-bold tracking-[0.25em] uppercase mb-4">
                        <Flame size={12} />
                        {campaign.badgeText || 'DIWALI FESTIVE EDITION'}
                      </div>

                      <h1 className="font-display font-bold text-3xl md:text-5xl leading-[1.05] tracking-tight uppercase mb-4 text-[#FAF5ED]">
                        {campaign.headline || 'DIWALI VIBES. BIGGER DROPS. BETTER DEALS.'}
                      </h1>

                      <p className="text-xs md:text-sm text-vy-cream uppercase tracking-widest leading-relaxed mb-6 max-w-sm">
                        {campaign.subtitle ||
                          'Celebrate the festival of lights with your favourite VYBERA fits.'}
                      </p>

                      {campaign.discountPercent > 0 && (
                        <div className="mb-6 inline-block bg-[#FAF5ED] text-vy-burgundy font-black text-xs px-3 py-1.5 uppercase tracking-widest">
                          Flat {campaign.discountPercent}% OFF APPLIED
                        </div>
                      )}

                      <div>
                        <span className="btn-primary inline-flex !py-3.5 !px-8 pointer-events-none">
                          {campaign.ctaText || 'SHOP DIWALI SALE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDiwaliCampaign;
