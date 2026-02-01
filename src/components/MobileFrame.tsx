import { ReactNode } from 'react';
import { StatusBar } from './StatusBar';

interface MobileFrameProps {
  children: ReactNode;
}

export const MobileFrame = ({ children }: MobileFrameProps) => {
  return (
    <div className="mobile-frame-container">
      <div className="mobile-frame-wrapper">
        {/* Phone frame (only visible on larger screens) */}
        <div className="mobile-frame-bezel" />
        
        {/* iOS Status Bar (only visible on larger screens) */}
        <StatusBar />
        
        {/* App content - relative positioning for absolute children */}
        <div className="mobile-frame-content relative" data-mobile-frame>
          {children}
        </div>
      </div>
    </div>
  );
};
