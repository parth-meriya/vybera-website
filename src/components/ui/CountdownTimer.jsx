import { useEffect, useState } from 'react';

export const CountdownTimer = ({ endDate, campaignName }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endDate) - new Date();
      if (difference <= 0) {
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) return null;

  return (
    <div className="bg-vy-card/40 border border-vy-border/50 p-4 my-6 rounded-sm max-w-sm">
      <p className="text-[10px] text-vy-accent tracking-widest uppercase font-bold mb-2.5">
        ⏳ {campaignName || 'LIMITED TIME SALE'} ENDING SOON
      </p>
      <div className="flex gap-4">
        {[
          { label: 'Days', val: timeLeft.days },
          { label: 'Hrs', val: timeLeft.hours },
          { label: 'Min', val: timeLeft.minutes },
          { label: 'Sec', val: timeLeft.seconds },
        ].map((unit, i) => (
          <div key={i} className="flex flex-col items-center flex-1 bg-vy-dark/60 py-2 border border-vy-white/5 rounded-sm relative group">
            <span className="text-vy-white font-mono text-xl font-bold tracking-tight">
              {String(unit.val).padStart(2, '0')}
            </span>
            <span className="text-vy-grey text-[9px] uppercase tracking-wider font-semibold mt-1">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
