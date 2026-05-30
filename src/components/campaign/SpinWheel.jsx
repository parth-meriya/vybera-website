import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

// Hardcoded segments matching backend (we could also pass these as props)
const segments = [
  { label: '20% OFF', color: '#1D3328' }, // vy-card
  { label: '30% OFF', color: '#0F1F18' }, // vy-black
  { label: '50% OFF', color: '#C4A06B' }, // vy-gold
  { label: '70% OFF', color: '#DCCCB5' }, // vy-accent
  { label: 'FREE TEE', color: '#F5F1E8' }, // vy-white
];

const SpinWheel = ({ isSpinning, winningIndex, onSpinComplete }) => {
  const controls = useAnimation();
  const [currentRotation, setCurrentRotation] = useState(0);

  const numSegments = segments.length;
  const segmentAngle = 360 / numSegments;

  useEffect(() => {
    if (isSpinning && winningIndex !== null) {
      // Calculate how much to rotate
      // We want it to spin a few times before stopping
      const spins = 5; // 5 full rotations
      const extraDegrees = 360 - (winningIndex * segmentAngle) - (segmentAngle / 2); // Center of segment
      
      const targetRotation = currentRotation + (spins * 360) + extraDegrees - (currentRotation % 360);

      controls.start({
        rotate: targetRotation,
        transition: {
          duration: 5,
          ease: [0.2, 0.8, 0.2, 1], // easeOutCubic-ish for smooth slow down
        },
      }).then(() => {
        setCurrentRotation(targetRotation);
        if (onSpinComplete) onSpinComplete();
      });
    }
  }, [isSpinning, winningIndex, controls]);

  return (
    <div className="relative w-72 h-72 sm:w-96 sm:h-96 mx-auto">
      {/* Pointer/Marker */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-8 h-10 overflow-hidden flex justify-center drop-shadow-xl">
        <div className="w-8 h-8 bg-vy-white rotate-45 transform origin-bottom border-4 border-vy-black shadow-inner" />
      </div>

      {/* The Wheel */}
      <motion.div
        className="w-full h-full rounded-full border-8 border-vy-white shadow-[0_0_50px_rgba(196,160,107,0.3)] overflow-hidden relative"
        animate={controls}
        initial={{ rotate: 0 }}
      >
        {segments.map((segment, index) => {
          const rotation = index * segmentAngle;
          // Background text color adaptation
          const isLight = segment.color === '#F5F1E8' || segment.color === '#DCCCB5';
          
          return (
            <div
              key={index}
              className="absolute top-0 left-0 w-full h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.tan((segmentAngle / 2) * (Math.PI / 180))}% 0%)`,
                backgroundColor: segment.color,
                // Adjusting polygon to make a proper slice from the center
              }}
            >
              {/* Wait, traditional CSS slices using clip-path on full divs are tricky. 
                  Let's use conic-gradient for the wheel background, and just position the text. */}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

// Better implementation using SVG for perfect slices
const SVGSpinWheel = ({ isSpinning, winningIndex, onSpinComplete }) => {
  const controls = useAnimation();
  const [currentRotation, setCurrentRotation] = useState(0);

  const numSegments = segments.length;
  const segmentAngle = 360 / numSegments;

  useEffect(() => {
    if (isSpinning && winningIndex !== null) {
      const spins = 5;
      
      // We want the WINNING segment to end up at the top (270 degrees in SVG math, or 0 degrees if pointer is at top).
      // Assuming pointer is at Top (0 degrees / 12 o'clock).
      // The segment `i` spans from `i * segmentAngle` to `(i + 1) * segmentAngle`.
      // The center of segment `i` is `(i + 0.5) * segmentAngle`.
      // To bring segment `i`'s center to the top (0 degrees), we need to rotate by `360 - centerAngle`.
      
      const centerAngle = (winningIndex + 0.5) * segmentAngle;
      const rotationToTop = 360 - centerAngle;
      
      const targetRotation = currentRotation + (spins * 360) + rotationToTop - (currentRotation % 360);

      controls.start({
        rotate: targetRotation,
        transition: {
          duration: 5, // 5 seconds spin
          ease: [0.1, 0.9, 0.2, 1], // Decelerate smoothly
        },
      }).then(() => {
        setCurrentRotation(targetRotation);
        if (onSpinComplete) onSpinComplete();
      });
    }
  }, [isSpinning, winningIndex, controls]);

  const radius = 50;
  const cx = 50;
  const cy = 50;

  return (
    <div className="relative w-80 h-80 sm:w-96 sm:h-96 mx-auto">
      {/* Outer Glow */}
      <div className="absolute inset-0 rounded-full shadow-[0_0_50px_rgba(196,160,107,0.3)] animate-pulse" />

      {/* Pointer */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-vy-white filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />

      <motion.div
        className="w-full h-full rounded-full border-8 border-vy-white relative bg-vy-black overflow-hidden shadow-2xl"
        animate={controls}
        initial={{ rotate: 0 }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {segments.map((segment, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;

            // Convert angles to radians
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            // Calculate coordinates
            const x1 = cx + radius * Math.cos(startRad);
            const y1 = cy + radius * Math.sin(startRad);
            const x2 = cx + radius * Math.cos(endRad);
            const y2 = cy + radius * Math.sin(endRad);

            const largeArcFlag = segmentAngle > 180 ? 1 : 0;

            const pathData = [
              `M ${cx} ${cy}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');

            // Calculate text position (center of the slice)
            const textAngle = startAngle + segmentAngle / 2;
            const textRad = (textAngle * Math.PI) / 180;
            const textRadius = radius * 0.65; // Place text 65% out from center
            const tx = cx + textRadius * Math.cos(textRad);
            const ty = cy + textRadius * Math.sin(textRad);

            const isLight = segment.color === '#F5F1E8' || segment.color === '#DCCCB5' || segment.color === '#C4A06B';

            return (
              <g key={index}>
                <path d={pathData} fill={segment.color} stroke="#0F1F18" strokeWidth="0.5" />
                
                {/* Text rotation: 
                    Text is normally horizontal. We want it pointing outward.
                    We rotate it by textAngle. 
                */}
                <text
                  x={tx}
                  y={ty}
                  fill={isLight ? '#0F1F18' : '#F5F1E8'}
                  fontSize="5"
                  fontWeight="bold"
                  fontFamily="Inter, sans-serif"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                  letterSpacing="0.2"
                >
                  {segment.label}
                </text>
              </g>
            );
          })}
          
          {/* Inner Circle Decoration */}
          <circle cx="50" cy="50" r="10" fill="#0F1F18" stroke="#C4A06B" strokeWidth="2" />
          <circle cx="50" cy="50" r="3" fill="#C4A06B" />
        </svg>
      </motion.div>
    </div>
  );
};

export default SVGSpinWheel;
