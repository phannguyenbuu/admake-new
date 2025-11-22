import React, { useState, useEffect } from "react";
import { Spin } from "antd";

interface ResponsiveTransitionProps {
  children: React.ReactNode;
  isMobile: boolean;
  delay?: number;
}

const ResponsiveTransition: React.FC<ResponsiveTransitionProps> = ({
  children,
  isMobile,
  delay = 100,
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentView, setCurrentView] = useState<"mobile" | "desktop">(
    isMobile ? "mobile" : "desktop"
  );

  useEffect(() => {
    const newView = isMobile ? "mobile" : "desktop";

    if (newView !== currentView) {
      setIsTransitioning(true);

      const timer = setTimeout(() => {
        setCurrentView(newView);
        setIsTransitioning(false);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isMobile, currentView, delay]);

  // Prevent unnecessary re-renders
  const shouldRender = React.useMemo(() => {
    return (
      !isTransitioning && currentView === (isMobile ? "mobile" : "desktop")
    );
  }, [isTransitioning, currentView, isMobile]);

  if (isTransitioning) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spin size="large" tip="Đang chuyển đổi giao diện..." />
      </div>
    );
  }

  return shouldRender ? <>{children}</> : null;
};

export default ResponsiveTransition;
