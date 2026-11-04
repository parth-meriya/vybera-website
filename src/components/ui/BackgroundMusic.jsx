import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Sparkles,
  X,
  Sliders,
} from 'lucide-react';
import { getMusicConfig, DEFAULT_MUSIC_CONFIG } from '../../firebase/content';

const STORAGE_KEY_PREF = 'vy_music_user_intent'; // 'play' | 'paused' | 'muted'
const STORAGE_KEY_VOLUME = 'vy_music_volume';
const STORAGE_KEY_PROMPT = 'vy_music_prompt_shown';

const BackgroundMusic = () => {
  const [config, setConfig] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
    return saved !== null ? Number(saved) : 0.25;
  });
  const [showPrompt, setShowPrompt] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioRef = useRef(null);
  const playAttemptedRef = useRef(false);

  // 1. Fetch Admin Music Configuration
  useEffect(() => {
    getMusicConfig().then((cfg) => {
      if (cfg && cfg.enabled) {
        setConfig(cfg);
        if (cfg.defaultVolume && localStorage.getItem(STORAGE_KEY_VOLUME) === null) {
          setVolume(cfg.defaultVolume);
        }
      } else {
        setConfig(null);
      }
    }).catch(() => {
      setConfig(DEFAULT_MUSIC_CONFIG);
    });
  }, []);

  // 2. Initialize Audio Instance & Handle Autoplay Permissions
  useEffect(() => {
    if (!config || !config.musicUrl || playAttemptedRef.current) return;
    playAttemptedRef.current = true;

    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;

    const userPref = sessionStorage.getItem(STORAGE_KEY_PREF);

    // If user previously paused or muted during this session, respect it
    if (userPref === 'paused') {
      setIsPlaying(false);
      return;
    }
    if (userPref === 'muted') {
      setIsMuted(true);
      audio.volume = 0;
    }

    // Only attempt playback if user explicitly requested it in this session
    if (userPref === 'play') {
      const promise = audio.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      }
    } else {
      // Do not eager-load 8.5MB audio over network until user opts in
      setIsPlaying(false);
      const promptShown = sessionStorage.getItem(STORAGE_KEY_PROMPT);
      if (!promptShown && config.showWelcomePrompt !== false && userPref !== 'paused') {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [config]);

  // 3. Keep Audio Volume & Mute in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      localStorage.setItem(STORAGE_KEY_VOLUME, volume.toString());
    }
  }, [volume, isMuted]);

  // Handle Play / Pause Toggle
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      sessionStorage.setItem(STORAGE_KEY_PREF, 'paused');
    } else {
      audio.volume = isMuted ? 0 : volume;
      audio.play().then(() => {
        setIsPlaying(true);
        sessionStorage.setItem(STORAGE_KEY_PREF, 'play');
        setShowPrompt(false);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  // Handle Mute / Unmute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sessionStorage.setItem(STORAGE_KEY_PREF, nextMuted ? 'muted' : 'play');
    if (nextMuted) {
      if (audioRef.current) audioRef.current.volume = 0;
    } else {
      if (audioRef.current) audioRef.current.volume = volume;
      if (!isPlaying && audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  // Prompt Actions
  const handleAcceptPrompt = () => {
    sessionStorage.setItem(STORAGE_KEY_PROMPT, 'true');
    setShowPrompt(false);
    setIsMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        sessionStorage.setItem(STORAGE_KEY_PREF, 'play');
      }).catch((err) => {
        console.warn('Playback error after user click:', err);
      });
    }
  };

  const handleDismissPrompt = () => {
    sessionStorage.setItem(STORAGE_KEY_PROMPT, 'true');
    setShowPrompt(false);
    sessionStorage.setItem(STORAGE_KEY_PREF, 'paused');
  };

  if (!config || !config.enabled) return null;

  return (
    <>
      {/* Hidden Persistent Audio Element */}
      <audio
        ref={audioRef}
        src={config.musicUrl}
        loop
        preload="none"
        onError={() => {
          console.warn('Diwali audio file failed to load, falling back to local ambient.');
        }}
      />

      {/* ── 1. Minimal Floating Burgundy Music Button ──────────────── */}
      <div className="fixed bottom-6 left-5 z-40 flex flex-col items-start gap-2">
        <div className="relative">
          <motion.button
            type="button"
            onClick={() => setShowControls((prev) => !prev)}
            aria-label="Diwali Music Player"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className={`w-12 h-12 rounded-full bg-[#590907] text-[#FAF5ED] border border-[#E8D2B5]/50 shadow-2xl flex items-center justify-center transition-all ${
              isPlaying ? 'ring-2 ring-[#E8D2B5]/40' : 'opacity-85'
            }`}
          >
            {isPlaying && !isMuted ? (
              // 3 Equalizer Soundwave Bars
              <div className="flex items-end gap-1 h-4">
                <span className="w-1 bg-[#E8D2B5] rounded-full animate-bounce h-3" style={{ animationDuration: '0.6s' }} />
                <span className="w-1 bg-[#FAF5ED] rounded-full animate-bounce h-4" style={{ animationDuration: '0.8s' }} />
                <span className="w-1 bg-[#E8D2B5] rounded-full animate-bounce h-2.5" style={{ animationDuration: '0.5s' }} />
              </div>
            ) : isMuted ? (
              <VolumeX size={18} className="text-[#E8D2B5]" />
            ) : (
              <Music size={18} className="text-[#E8D2B5]" />
            )}
          </motion.button>

          {/* Quick Floating Status Pill */}
          {isPlaying && !isMuted && !showControls && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden sm:flex absolute left-14 top-2.5 bg-[#FAF5ED]/95 backdrop-blur-md border border-[#E5DACD] text-[#30231F] text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 shadow-md whitespace-nowrap items-center gap-1.5"
            >
              <Sparkles size={11} className="text-[#590907]" />
              Festive Vibes On
            </motion.span>
          )}
        </div>

        {/* ── 2. Expanded Music Control Popover ──────────────────────── */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="bg-[#FAF5ED] border border-[#E5DACD] text-[#30231F] p-4 shadow-2xl w-64 rounded-none space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#E5DACD] pb-2">
                <div className="flex items-center gap-1.5">
                  <Music size={14} className="text-[#590907]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#590907]">
                    Diwali Soundtrack
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowControls(false)}
                  className="p-1 text-[#7A6E69] hover:text-[#590907]"
                >
                  <X size={14} />
                </button>
              </div>

              <div>
                <p className="text-xs font-bold text-[#30231F] truncate">
                  {config.title || 'Diwali Festive Instrumental'}
                </p>
                <p className="text-[9px] text-[#7A6E69] uppercase tracking-wider mt-0.5">
                  Soft Flute, Sitar & Festive Bells
                </p>
              </div>

              {/* Play / Pause & Mute Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex-1 py-2 bg-[#590907] text-[#FAF5ED] text-[10px] font-bold uppercase tracking-widest hover:bg-[#430605] transition-colors flex items-center justify-center gap-1.5"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={12} /> Pause
                    </>
                  ) : (
                    <>
                      <Play size={12} className="fill-current" /> Play
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 border border-[#E5DACD] bg-white text-[#30231F] hover:text-[#590907] transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="pt-2 border-t border-[#E5DACD]">
                <div className="flex justify-between items-center text-[10px] font-semibold text-[#7A6E69] mb-1">
                  <span>Volume</span>
                  <span>{Math.round((isMuted ? 0 : volume) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVol = parseFloat(e.target.value);
                    setVolume(newVol);
                    if (isMuted && newVol > 0) setIsMuted(false);
                  }}
                  className="w-full h-1.5 bg-[#E8D2B5] rounded-lg appearance-none cursor-pointer accent-[#590907]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 3. Small Elegant Welcome Prompt (Autoplay Fallback) ─────── */}
      <AnimatePresence>
        {showPrompt && !isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 left-5 sm:left-6 z-50 bg-[#FAF5ED] border border-[#E5DACD] text-[#30231F] p-4 sm:p-5 shadow-2xl max-w-xs sm:max-w-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-[#590907] text-[#FAF5ED]">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold tracking-tight text-[#30231F]">
                    Celebrate the VYBERA Diwali vibes ✨
                  </h4>
                  <p className="text-[11px] text-[#7A6E69] mt-0.5">
                    Turn on festive music?
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismissPrompt}
                className="text-[#A5A79B] hover:text-[#30231F] p-1"
                aria-label="Dismiss prompt"
              >
                <X size={15} />
              </button>
            </div>

            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleAcceptPrompt}
                className="flex-1 py-2.5 bg-[#590907] text-[#FAF5ED] text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#430605] transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <Play size={12} className="fill-current" />
                PLAY MUSIC
              </button>
              <button
                type="button"
                onClick={handleDismissPrompt}
                className="px-3 py-2.5 text-[10px] font-semibold text-[#7A6E69] hover:text-[#30231F] uppercase tracking-wider"
              >
                Not Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BackgroundMusic;
