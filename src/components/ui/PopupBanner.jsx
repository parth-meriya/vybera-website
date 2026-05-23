/**
 * VYBERA — Login Popup Banner Component
 *
 * Premium dark-luxury popup that appears once after login.
 * Fetches the active popup from Firestore and displays it
 * with smooth animations and blur backdrop.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { getActivePopup } from '../../firebase/popupBanner';

const SESSION_KEY = 'vy_popup_shown';
const PLACEHOLDER = 'https://placehold.co/600x400/1C2A21/B78E5C?text=VYBERA';

const PopupBanner = () => {
  const [popup, setPopup] = useState(null);
  const [visible, setVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // Show once per session for every visitor
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) return;

    // Fetch active popup
    const fetchPopup = async () => {
      const data = await getActivePopup();
      if (data && data.imageUrl) {
        setPopup(data);

        // Preload the image before showing popup
        const img = new Image();
        img.src = data.imageUrl;
        img.onload = () => {
          setImgLoaded(true);
          // Small delay so page loads first
          setTimeout(() => setVisible(true), 1000);
        };
        img.onerror = () => {
          setImgError(true);
          setImgLoaded(true);
          setTimeout(() => setVisible(true), 1000);
        };
      }
    };

    fetchPopup();
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    // Mark as shown for this session
    sessionStorage.setItem(SESSION_KEY, 'true');
  }, []);

  // Listen for Escape key to close the popup banner
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, handleClose]);

  const handleCTA = useCallback(() => {
    if (popup?.buttonLink) {
      // Internal link or external
      if (popup.buttonLink.startsWith('/')) {
        window.location.href = popup.buttonLink;
      } else {
        window.open(popup.buttonLink, '_blank', 'noopener');
      }
    }
    handleClose();
  }, [popup, handleClose]);

  if (!popup || !imgLoaded) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop Overlay (darkens background, pointer interactions enabled) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md cursor-pointer pointer-events-auto"
            style={{ zIndex: 9998 }}
            onClick={handleClose}
          />

          {/* Popup Container (centered, transparent to pointer events outside the modal) */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
            style={{ zIndex: 9999 }}
            role="dialog"
            aria-modal="true"
            aria-label="Announcement"
          >
            {/* Popup Card (allows interactions, supports all screen sizes) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[340px] sm:max-w-lg overflow-hidden max-h-[85vh] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-br from-vy-accent/20 via-transparent to-vy-accent/10 blur-xl opacity-60 pointer-events-none" />

              <div className="relative bg-vy-dark border border-vy-border/60 overflow-hidden shadow-2xl shadow-black/50">
                {/* Close (X) Button (always visible, z-index 10000, 40x40px clickable size) */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/80 hover:scale-105 transition-all duration-300 rounded-full pointer-events-auto group"
                  style={{ zIndex: 10000 }}
                  aria-label="Close popup"
                >
                  <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>

                {/* Banner Image — 4:5 portrait on mobile, 3:2 landscape on desktop */}
                <div className="relative w-full aspect-[4/5] sm:aspect-[3/2] bg-vy-black overflow-hidden">
                  {imgError ? (
                    <div className="w-full h-full flex items-center justify-center bg-vy-card">
                      <div className="text-center">
                        <div className="text-vy-accent text-3xl font-display font-bold tracking-[0.3em] mb-2">VYBERA</div>
                        <p className="text-vy-grey text-xs tracking-widest uppercase">New Collection Available</p>
                      </div>
                    </div>
                  ) : (
                    <motion.img
                      src={popup.imageUrl}
                      alt={popup.title || 'VYBERA Announcement'}
                      className="w-full h-full object-cover"
                      initial={{ scale: 1.05 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      loading="eager"
                      onError={() => setImgError(true)}
                    />
                  )}

                  {/* Bottom gradient overlay */}
                  {(popup.title || popup.buttonText) && (
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-vy-dark via-vy-dark/60 to-transparent pointer-events-none" />
                  )}
                </div>

                {/* Content Area */}
                {(popup.title || popup.buttonText) && (
                  <div className="relative px-6 pb-6 pt-2 -mt-10 z-10">
                    {popup.title && (
                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="font-display font-bold text-xl sm:text-2xl tracking-wider text-vy-white mb-3 leading-tight"
                      >
                        {popup.title}
                      </motion.h2>
                    )}

                    {popup.buttonText && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleCTA}
                        className="btn-primary flex items-center gap-2 text-sm"
                      >
                        {popup.buttonText}
                        {popup.buttonLink && <ExternalLink size={13} />}
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Decorative accent line */}
                <div className="h-0.5 bg-gradient-to-r from-transparent via-vy-accent to-transparent" />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PopupBanner;
