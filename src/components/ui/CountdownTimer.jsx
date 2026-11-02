import { useEffect, useState } from 'react';

export const CountdownTimer = ({ endDate, campaignName = 'DIWALI SALE' }) => {
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
    <div className="bg-[#FAF5ED]/95 backdrop-blur-md border border-[#E5DACD] p-3.5 shadow-lg max-w-xs text-vy-text">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-2 h-2 rounded-full bg-vy-burgundy animate-ping" />
        <p className="text-[10px] text-vy-burgundy tracking-[0.25em] uppercase font-black">
          {campaignName} • DROPS ENDING
        </p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Days', val: timeLeft.days },
          { label: 'Hours', val: timeLeft.hours },
          { label: 'Mins', val: timeLeft.minutes },
          { label: 'Secs', val: timeLeft.seconds },
        ].map((unit, i) => (
          <div
            key={i}
            className="flex flex-col items-center bg-[#F3E7D8] py-1.5 border border-[#E5DACD]"
          >
            <span className="text-vy-burgundy font-mono text-base md:text-lg font-black tracking-tight leading-none">
              {String(unit.val).padStart(2, '0')}
            </span>
            <span className="text-vy-text-muted text-[8px] uppercase tracking-wider font-semibold mt-1">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
