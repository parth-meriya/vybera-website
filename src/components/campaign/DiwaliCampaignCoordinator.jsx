/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import DiwaliSpinModal from './DiwaliSpinModal';
import DiwaliSpinFloatingButton from './DiwaliSpinFloatingButton';
import {
  DIWALI_CAMPAIGN_ID,
  DIWALI_CAMPAIGN_DEFAULTS,
  getDiwaliCampaignStatus,
} from '../../utils/diwaliCampaignSchedule';

const SESSION_DISMISSED_KEY = 'vy_diwali_spin_dismissed';

export const DiwaliCampaignCoordinator = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [campaign, setCampaign] = useState(DIWALI_CAMPAIGN_DEFAULTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState({ isLive: false, status: 'upcoming' });

  // 1. Fetch Campaign Settings & Check URL for preview mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewQuery = params.get('preview') === 'true' || params.get('diwaliPreview') === 'true';

    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'campaigns', DIWALI_CAMPAIGN_ID));
        let data = DIWALI_CAMPAIGN_DEFAULTS;
        if (snap.exists()) {
          data = { ...DIWALI_CAMPAIGN_DEFAULTS, ...snap.data() };
        }
        setCampaign(data);

        // Check if admin preview in session
        const sessionPreview = sessionStorage.getItem('vy_diwali_admin_preview') === 'true';
        const activePreview = previewQuery || sessionPreview;
        setIsPreview(activePreview);

        const status = getDiwaliCampaignStatus(data, { isPreview: activePreview });
        setScheduleStatus(status);
      } catch (err) {
        console.warn('Error fetching Diwali campaign settings:', err);
        const status = getDiwaliCampaignStatus(DIWALI_CAMPAIGN_DEFAULTS, { isPreview: previewQuery });
        setScheduleStatus(status);
      }
    };

    fetchConfig();
  }, [location.search]);

  // 2. Check if logged-in customer has already spun
  useEffect(() => {
    let active = true;

    const checkSpun = async () => {
      if (!user) {
        if (active) setHasSpun(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'spinResults'),
          where('uid', '==', user.uid),
          where('campaignId', '==', DIWALI_CAMPAIGN_ID)
        );
        const snap = await getDocs(q);
        if (active) {
          setHasSpun(!snap.empty);
        }
      } catch {
        // Ignore permission or index errors
      }
    };

    checkSpun();

    return () => {
      active = false;
    };
  }, [user]);

  // 3. Trigger popup after successful login during campaign period
  useEffect(() => {
    if (!scheduleStatus.isLive && !isPreview) return;
    if (!user) return; // Only show popup after login as requested
    if (hasSpun) return; // Don't pop up if they already spun

    // Check if dismissed in this browser session
    const isDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    if (isDismissed) return;

    // Small delay for natural UI arrival
    const timer = setTimeout(() => {
      setModalOpen(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, [user, scheduleStatus.isLive, hasSpun, isPreview]);

  // 4. Global event listener for opening modal manually (from buttons / hero / admin)
  useEffect(() => {
    const handleOpenEvent = (e) => {
      if (e?.detail?.preview) {
        setIsPreview(true);
      }
      setModalOpen(true);
    };

    window.addEventListener('open-diwali-spin', handleOpenEvent);
    return () => window.removeEventListener('open-diwali-spin', handleOpenEvent);
  }, []);

  const handleCloseModal = () => {
    setModalOpen(false);
    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
  };

  // Only render if campaign is active, in Admin Preview mode, or modal was manually triggered
  if (!scheduleStatus.isLive && !isPreview && !modalOpen) {
    return null;
  }

  // Do not show on admin management pages to avoid overlaying admin tables
  if (location.pathname.startsWith('/admin')) {
    return (
      <DiwaliSpinModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        campaignData={campaign}
        isPreview={isPreview}
      />
    );
  }

  return (
    <>
      {/* Floating Spin & Win launcher icon */}
      <DiwaliSpinFloatingButton
        onClick={() => setModalOpen(true)}
        hasSpun={hasSpun}
      />

      {/* Diwali Spin & Win Modal */}
      <DiwaliSpinModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        campaignData={campaign}
        isPreview={isPreview}
      />
    </>
  );
};

export default DiwaliCampaignCoordinator;
