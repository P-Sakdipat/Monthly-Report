'use client';

import React from 'react';

/**
 * Premium animated full-page skeleton loader for state checks and page transitions
 */
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="skeleton-container">
      <div className="skeleton-loader-card">
        <div className="skeleton-pulse-ring"></div>
        <div className="skeleton-logo-dot"></div>
        <h3 className="skeleton-heading">MD_monthly</h3>
        <p className="skeleton-text">กำลังโหลดข้อมูลความปลอดภัย...</p>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
