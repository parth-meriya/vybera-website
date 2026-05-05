import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { getBannerConfig } from '../../firebase/content';
import { motion, AnimatePresence } from 'framer-motion';

const BackgroundMusic = () => {
  const [config, setConfig] = useState(null);
  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('vy_music_muted') !== 'false'; // Default to muted for safety
  });
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('vy_music_muted', isMuted);
  }, [isMuted]);

  useEffect(() => {
    getBannerConfig().then(c => {
      // Manual fallback for Anniversary if no music is set or enabled
      const defaultMusic = {
        musicEnabled: true,
        musicUrl: "/sounds/background.mp3" // Prioritize local optimized file
      };
      
      const finalConfig = (c && c.musicUrl) ? c : defaultMusic;
      if (finalConfig.musicEnabled && finalConfig.musicUrl) {
        setConfig(finalConfig);
      }
    });

    const handleInteraction = () => {
      setHasInteracted(true);
      window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);

    return () => window.removeEventListener('click', handleInteraction);
  }, []);

  useEffect(() => {
    if (config && hasInteracted && audioRef.current) {
      const audio = audioRef.current;
      audio.volume = 0.2; // Low volume by default
      
      if (!isMuted) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Playback failed:", error);
          });
        }
      } else {
        audio.pause();
      }
    }
  }, [isMuted, hasInteracted, config]);

  const handleAudioError = () => {
    // If local file fails, fallback to a stable CDN
    if (config?.musicUrl === "/sounds/background.mp3") {
      setConfig(prev => ({
        ...prev,
        musicUrl: "https://www.chosic.com/wp-content/uploads/2021/07/Rainy-Day-Background-Piano-Music.mp3"
      }));
    }
  };

  if (!config) return null;

  return (
    <>
      <audio 
        ref={audioRef}
        src={config.musicUrl}
        loop
        preload="auto"
        crossOrigin="anonymous"
        onError={handleAudioError}
      />
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-24 left-6 z-[9999]"
        >
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 bg-vy-accent text-vy-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            title={isMuted ? "Unmute Background Music" : "Mute Background Music"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            {!hasInteracted && isMuted && (
              <span className="absolute left-12 whitespace-nowrap bg-vy-black border border-vy-border text-vy-white text-[10px] px-2 py-1 uppercase tracking-widest">
                Click to play music
              </span>
            )}
          </button>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default BackgroundMusic;
