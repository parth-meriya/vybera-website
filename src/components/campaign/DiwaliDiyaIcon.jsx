import React from 'react';

/**
 * Premium SVG Diya illustration with animated warm flickering flame and gold base.
 */
export const DiwaliDiyaIcon = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
    >
      <defs>
        {/* Flame gradient */}
        <linearGradient id="diyaFlameGrad" x1="32" y1="4" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF4D0" />
          <stop offset="30%" stopColor="#FFC837" />
          <stop offset="70%" stopColor="#FF8008" />
          <stop offset="100%" stopColor="#D9381E" />
        </linearGradient>

        {/* Flame inner core */}
        <linearGradient id="diyaFlameCore" x1="32" y1="12" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#FFE57F" />
          <stop offset="100%" stopColor="#FFA000" />
        </linearGradient>

        {/* Gold Clay Pot gradient */}
        <linearGradient id="diyaPotGrad" x1="12" y1="32" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E5B95C" />
          <stop offset="35%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#996515" />
          <stop offset="100%" stopColor="#590907" />
        </linearGradient>

        {/* Glow Filter */}
        <filter id="diyaGlow" x="16" y="0" width="32" height="40" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer ambient aura glow */}
      <circle cx="32" cy="20" r="14" fill="#FFC837" fillOpacity="0.25" className="animate-pulse" />

      {/* Flame */}
      <g filter="url(#diyaGlow)">
        <path
          d="M32 6C32 6 38 16 38 23C38 27.5 35.3 31 32 31C28.7 31 26 27.5 26 23C26 16 32 6 32 6Z"
          fill="url(#diyaFlameGrad)"
        >
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1 1; 1.05 0.95; 0.95 1.03; 1 1"
            dur="1.6s"
            repeatCount="indefinite"
            transform-origin="32 28"
          />
        </path>
        {/* Inner flame core */}
        <path
          d="M32 14C32 14 35.5 20 35.5 24C35.5 26.5 34 28.5 32 28.5C30 28.5 28.5 26.5 28.5 24C28.5 20 32 14 32 14Z"
          fill="url(#diyaFlameCore)"
        />
      </g>

      {/* Diya Base (Pot) */}
      <path
        d="M10 34C12 47 22 55 32 55C42 55 52 47 54 34C48 37 40 38 32 38C24 38 16 37 10 34Z"
        fill="url(#diyaPotGrad)"
        stroke="#E8D2B5"
        strokeWidth="1"
      />

      {/* Diya Rim */}
      <ellipse
        cx="32"
        cy="34"
        rx="22"
        ry="4.5"
        fill="#825114"
        stroke="#D4AF37"
        strokeWidth="1.2"
      />
      <ellipse
        cx="32"
        cy="34"
        rx="18"
        ry="3"
        fill="#590907"
      />

      {/* Decorative Base Stand */}
      <path
        d="M26 55L24 58C24 58 28 59 32 59C36 59 40 58 40 58L38 55H26Z"
        fill="#D4AF37"
      />
    </svg>
  );
};

export default DiwaliDiyaIcon;
