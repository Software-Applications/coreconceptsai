import { useState, useEffect } from 'react';
import { Signal, Wifi, BatteryFull } from 'lucide-react';

export const StatusBar = () => {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: false 
      }));
    };

    // Update immediately and then every minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="status-bar">
      {/* Time - Left side */}
      <span className="status-bar-time">{time}</span>
      
      {/* Icons - Right side */}
      <div className="status-bar-icons">
        <Signal size={14} strokeWidth={2.5} />
        <Wifi size={15} strokeWidth={2.5} />
        <div className="status-bar-battery">
          <BatteryFull size={18} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
};
