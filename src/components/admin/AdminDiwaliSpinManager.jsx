/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Save,
  Eye,
  Calendar,
  Gift,
  Ticket,
  Users,
  Check,
  AlertCircle,
  Clock,
  Play,
  RotateCcw,
  Percent,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import DiwaliDiyaIcon from '../campaign/DiwaliDiyaIcon';
import DiwaliSpinWheel, { DIWALI_SEGMENTS } from '../campaign/DiwaliSpinWheel';
import {
  DIWALI_CAMPAIGN_ID,
  DIWALI_CAMPAIGN_DEFAULTS,
  getDiwaliCampaignStatus,
  formatISTDate,
} from '../../utils/diwaliCampaignSchedule';

export const AdminDiwaliSpinManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState(DIWALI_CAMPAIGN_DEFAULTS);
  const [analytics, setAnalytics] = useState({
    totalSpins: 0,
    uniqueUsers: 0,
    couponsGenerated: 0,
    couponsRedeemed: 0,
    freeTeesWon: 0,
    revenue: 0,
    recentSpins: [],
  });

  const scheduleStatus = getDiwaliCampaignStatus(campaign);

  // ── Fetch Campaign Data & Live Metrics ──────────────────────────────
  const fetchCampaignData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Campaign doc
      const campSnap = await getDoc(doc(db, 'campaigns', DIWALI_CAMPAIGN_ID));
      if (campSnap.exists()) {
        setCampaign({ ...DIWALI_CAMPAIGN_DEFAULTS, ...campSnap.data() });
      }

      // 2. Fetch Analytics (spinResults, coupons, orders)
      const [spinsSnap, couponsSnap, ordersSnap] = await Promise.all([
        getDocs(query(collection(db, 'spinResults'), where('campaignId', '==', DIWALI_CAMPAIGN_ID))),
        getDocs(query(collection(db, 'coupons'), where('campaignId', '==', DIWALI_CAMPAIGN_ID))),
        getDocs(collection(db, 'orders')),
      ]);

      const spins = spinsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const coupons = couponsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Map of coupon codes for fast lookup in orders
      const diwaliCoupons = new Set(coupons.map((c) => c.code));

      let redeemedCount = 0;
      let revenue = 0;

      ordersSnap.docs.forEach((docSnap) => {
        const order = docSnap.data();
        if (order.couponCode && diwaliCoupons.has(order.couponCode)) {
          redeemedCount++;
          revenue += Number(order.total || order.amount || 0);
        }
      });

      const uniqueUsersSet = new Set(spins.map((s) => s.uid).filter(Boolean));
      const freeTees = spins.filter((s) => s.rewardType === 'free_tee').length;

      // Sort recent spins descending
      const sortedSpins = [...spins].sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setAnalytics({
        totalSpins: spins.length,
        uniqueUsers: uniqueUsersSet.size,
        couponsGenerated: coupons.length,
        couponsRedeemed: redeemedCount,
        freeTeesWon: freeTees,
        revenue,
        recentSpins: sortedSpins.slice(0, 8),
      });
    } catch (err) {
      console.error('Failed to load Diwali campaign data:', err);
      toast.error('Failed to load campaign data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, []);

  // ── Save Campaign Settings ──────────────────────────────────────────
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...campaign,
        id: DIWALI_CAMPAIGN_ID,
        expiryDays: Number(campaign.expiryDays) || 14,
        usageLimit: Number(campaign.usageLimit) || 0,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'campaigns', DIWALI_CAMPAIGN_ID), payload, { merge: true });

      toast.success('Diwali Spin & Win Campaign saved and published!', {
        className: 'toast-vybera',
      });
      fetchCampaignData();
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save campaign settings.');
    } finally {
      setSaving(false);
    }
  };

  // ── Launch Live Preview ─────────────────────────────────────────────
  const launchPreview = () => {
    sessionStorage.setItem('vy_diwali_admin_preview', 'true');
    window.dispatchEvent(new CustomEvent('open-diwali-spin', { detail: { preview: true } }));
    toast('Diwali Spin Wheel Live Preview opened!', {
      icon: '✨',
      className: 'toast-vybera',
    });
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#590907] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest text-[#75665C]">Loading Diwali Campaign...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── 1. Top Festive Hero Header & Schedule Pill ──────────────── */}
      <div className="bg-gradient-to-r from-[#FAF5ED] via-[#F3E7D8] to-[#E8D2B5] border-2 border-[#D4AF37] p-6 shadow-sm rounded-none relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DiwaliDiyaIcon size={26} />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#590907]">
                LIMITED-PERIOD FESTIVE PROMOTION (ASIA/KOLKATA IST)
              </span>
            </div>

            <h2 className="font-display font-black text-2xl text-[#590907] tracking-wider uppercase mb-1">
              {campaign.name || 'VYBERA DIWALI DHAMAKA — SPIN & WIN'}
            </h2>

            <p className="text-xs text-[#75665C] max-w-xl">
              Automatic limited-period Spin & Win experience for all registered customers from 7 Nov to 20 Nov 2026 IST.
              Includes single-spin enforcement, instant coupon generation, cart auto-apply, and admin live preview.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={launchPreview}
              className="px-4 py-2.5 bg-white border border-[#D4AF37] text-[#590907] hover:bg-[#D4AF37]/20 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-xs"
            >
              <Eye size={15} className="text-[#D4AF37]" />
              Preview Spin Wheel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#590907] hover:bg-[#430605] text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md transition-all disabled:opacity-60"
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Campaign'}
            </button>
          </div>
        </div>

        {/* Schedule & Live Status Row */}
        <div className="mt-6 pt-4 border-t border-[#D4BEA5] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                scheduleStatus.status === 'active'
                  ? 'bg-emerald-600 animate-pulse'
                  : scheduleStatus.status === 'upcoming'
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
            />
            <span className="font-bold text-[#30231F] uppercase tracking-wider">
              Schedule Status: {scheduleStatus.status.toUpperCase()}
            </span>
            <span className="text-[#75665C]">({scheduleStatus.message})</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#75665C]">
            <span>
              <strong className="text-[#30231F]">Start:</strong> {formatISTDate(campaign.startDate)}
            </span>
            <span>•</span>
            <span>
              <strong className="text-[#30231F]">End:</strong> {formatISTDate(campaign.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Participation & Metrics Overview (4 Cards) ─────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#75665C]">
              Total Participants
            </span>
            <Users size={16} className="text-[#590907]" />
          </div>
          <p className="font-display font-black text-2xl text-[#30231F]">
            {analytics.totalSpins}
          </p>
          <span className="text-[10px] text-[#75665C]">
            {analytics.uniqueUsers} unique customers (1 spin each)
          </span>
        </div>

        <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#75665C]">
              Coupons Generated
            </span>
            <Ticket size={16} className="text-[#590907]" />
          </div>
          <p className="font-display font-black text-2xl text-[#590907] font-mono">
            {analytics.couponsGenerated}
          </p>
          <span className="text-[10px] text-[#75665C]">Single-use user-tied coupons</span>
        </div>

        <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#75665C]">
              Coupons Redeemed
            </span>
            <CheckCircle2 size={16} className="text-emerald-700" />
          </div>
          <p className="font-display font-black text-2xl text-emerald-800 font-mono">
            {analytics.couponsRedeemed}
          </p>
          <span className="text-[10px] text-[#75665C]">Used in completed customer orders</span>
        </div>

        <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#75665C]">
              Campaign Revenue
            </span>
            <span className="font-bold text-xs text-[#590907]">₹ INR</span>
          </div>
          <p className="font-display font-black text-2xl text-[#590907] font-mono">
            ₹{analytics.revenue.toLocaleString()}
          </p>
          <span className="text-[10px] text-[#75665C]">{analytics.freeTeesWon} VIP Free Tee entries</span>
        </div>
      </div>

      {/* ── 3. Configuration Form & Wheel Matrix ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left (2 cols): Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[#590907] uppercase flex items-center gap-2">
              <Sparkles size={14} /> Campaign Details & Scheduling
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-1.5">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaign.name}
                  onChange={(e) => setCampaign((c) => ({ ...c, name: e.target.value }))}
                  placeholder="VYBERA DIWALI DHAMAKA — SPIN & WIN"
                  className="vy-input text-xs bg-white text-[#30231F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-1.5">
                  Headline Text
                </label>
                <input
                  type="text"
                  value={campaign.headline}
                  onChange={(e) => setCampaign((c) => ({ ...c, headline: e.target.value }))}
                  placeholder="VYBERA DIWALI DHAMAKA"
                  className="vy-input text-xs bg-white text-[#30231F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-1.5">
                  Main Slogan
                </label>
                <input
                  type="text"
                  value={campaign.mainText}
                  onChange={(e) => setCampaign((c) => ({ ...c, mainText: e.target.value }))}
                  placeholder="SPIN. WIN. SLAY."
                  className="vy-input text-xs bg-white text-[#30231F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-1.5">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={campaign.subtitle}
                  onChange={(e) => setCampaign((c) => ({ ...c, subtitle: e.target.value }))}
                  placeholder="Your Diwali surprise is waiting!"
                  className="vy-input text-xs bg-white text-[#30231F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-1.5">
                  Discounts Display Banner
                </label>
                <input
                  type="text"
                  value={campaign.discountDisplay}
                  onChange={(e) => setCampaign((c) => ({ ...c, discountDisplay: e.target.value }))}
                  placeholder="20% | 30% | 50% | 70% OFF"
                  className="vy-input text-xs bg-white text-[#30231F]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-1.5">
                  Coupon Validity (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={campaign.expiryDays}
                  onChange={(e) => setCampaign((c) => ({ ...c, expiryDays: e.target.value }))}
                  className="vy-input text-xs bg-white text-[#30231F]"
                />
              </div>
            </div>

            {/* Dates (Asia/Kolkata) */}
            <div className="pt-4 border-t border-[#D4BEA5] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-1.5">
                  Campaign Start (7 Nov 2026 IST)
                </label>
                <input
                  type="datetime-local"
                  value={campaign.startDate?.slice(0, 16) || '2026-11-07T00:00'}
                  onChange={(e) =>
                    setCampaign((c) => ({
                      ...c,
                      startDate: e.target.value ? `${e.target.value}:00+05:30` : '',
                    }))
                  }
                  className="vy-input text-xs bg-white text-[#30231F]"
                />
                <span className="text-[10px] text-[#75665C] mt-1 block">Timezone: Asia/Kolkata (IST)</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#75665C] mb-1.5">
                  Campaign End (20 Nov 2026 IST)
                </label>
                <input
                  type="datetime-local"
                  value={campaign.endDate?.slice(0, 16) || '2026-11-20T23:59'}
                  onChange={(e) =>
                    setCampaign((c) => ({
                      ...c,
                      endDate: e.target.value ? `${e.target.value}:59+05:30` : '',
                    }))
                  }
                  className="vy-input text-xs bg-white text-[#30231F]"
                />
                <span className="text-[10px] text-[#75665C] mt-1 block">Auto-stops after 20 Nov 2026</span>
              </div>
            </div>

            {/* Active Toggle */}
            <div className="pt-4 border-t border-[#D4BEA5] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#30231F] block">
                  Campaign Active Switch
                </span>
                <span className="text-[11px] text-[#75665C]">
                  When active, the Spin & Win popup & floating trigger appear during the campaign dates.
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={campaign.active}
                  onChange={(e) => setCampaign((c) => ({ ...c, active: e.target.checked }))}
                  className="w-5 h-5 accent-[#590907]"
                />
                <span className="text-xs font-bold uppercase tracking-widest text-[#590907]">
                  {campaign.active ? 'ACTIVE' : 'PAUSED'}
                </span>
              </label>
            </div>
          </div>

          {/* Reward Probabilities Matrix */}
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-[0.2em] text-[#590907] uppercase flex items-center gap-2">
                <Percent size={14} /> Verified Winning Probabilities & Discount Priority
              </h3>
              <span className="text-[10px] bg-[#D4AF37]/20 border border-[#D4AF37] px-2 py-0.5 text-[#590907] font-bold uppercase tracking-wider">
                Total: 100%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D4BEA5] text-[#75665C] text-[10px] uppercase tracking-widest">
                    <th className="py-2.5 px-3">Segment</th>
                    <th className="py-2.5 px-3">Reward Tier</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Probability</th>
                    <th className="py-2.5 px-3 text-right">Theme Color</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4BEA5]/60">
                  {DIWALI_SEGMENTS.map((seg, i) => {
                    const probMap = [40, 30, 18, 10, 2];
                    return (
                      <tr key={i} className="hover:bg-[#F3E7D8]/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#590907]">
                          #{i + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#30231F]">
                          {seg.label}
                        </td>
                        <td className="py-2.5 px-3 text-[#75665C]">
                          {seg.value ? 'Instant Percentage Coupon' : 'VIP Free Tee Entry'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#30231F]">
                          {probMap[i]}%
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-[#D4AF37]"
                            style={{ backgroundColor: seg.color }}
                            title={seg.color}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-[#75665C] mt-4 leading-relaxed">
              * Server-side RNG in <code className="text-[#590907] font-mono">/api/campaign/spin.js</code> strictly maintains these exact mathematical odds. Each code is generated as a single-use coupon, user-isolated to the customer's Firebase UID, and automatically shown in their Cart and My Coupons dashboard.
            </p>
          </div>
        </div>

        {/* Right (1 col): Visual Wheel Preview & Recent Spins */}
        <div className="space-y-6">
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-6 shadow-sm text-center">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[#590907] uppercase mb-1">
              Festive Wheel Design
            </h3>
            <p className="text-[11px] text-[#75665C] mb-4">
              Golden rim with 16 studs, animated Diya pointer and Burgundy-Gold segments.
            </p>

            <div className="scale-90 transform origin-top mb-4">
              <DiwaliSpinWheel isSpinning={false} size="compact" />
            </div>

            <button
              type="button"
              onClick={launchPreview}
              className="w-full py-3 bg-gradient-to-r from-[#590907] to-[#7B0D0A] hover:bg-[#430605] text-white text-xs font-bold uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 border border-[#D4AF37]"
            >
              <Play size={13} className="text-[#D4AF37]" />
              Test Live Spin Popup
            </button>
          </div>

          {/* Recent Participants */}
          <div className="bg-[#FAF5ED] border border-[#D4BEA5] p-5 shadow-sm space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#75665C] flex items-center justify-between">
              <span>Recent Participants</span>
              <span className="font-mono text-[#590907]">{analytics.recentSpins.length} recent</span>
            </h4>

            {analytics.recentSpins.length === 0 ? (
              <p className="text-xs text-[#75665C] italic py-4 text-center">
                No spins recorded yet. Spins will appear here once the campaign begins.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {analytics.recentSpins.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white border border-[#D4BEA5] rounded-none flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#30231F] block text-xs">
                        {s.name || s.email?.split('@')[0] || s.phoneNumber || 'Customer'}
                      </span>
                      <span className="text-[10px] text-[#75665C]">
                        {s.timestamp?.toDate?.()?.toLocaleDateString('en-IN') || 'Just now'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#590907] bg-[#590907]/10 px-2 py-0.5 border border-[#590907]/20">
                      {s.rewardWon}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDiwaliSpinManager;
