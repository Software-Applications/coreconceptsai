import { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
}

export const MobileFrame = ({ children }: MobileFrameProps) => {
  return (
    <div className="mobile-frame-container">
      <div className="mobile-frame-wrapper">
        {/* Phone frame (only visible on larger screens) */}
        <div className="mobile-frame-bezel" />
        
        {/* App content */}
        <div className="mobile-frame-content">
          {children}
        </div>
      </div>
    </div>
  );
};
