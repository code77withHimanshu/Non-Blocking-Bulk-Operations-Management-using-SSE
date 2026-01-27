/**
 * Animated Progress Bar component
 */

import React from 'react';
import './ProgressBar.css';

export function ProgressBar({
  progress = 0,
  size = 'medium',
  variant = 'primary',
  showLabel = false,
  animated = true,
  className = ''
}) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const classNames = [
    'progress-bar',
    `progress-bar-${size}`,
    `progress-bar-${variant}`,
    animated ? 'progress-bar-animated' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-bar-label">{Math.round(clampedProgress)}%</span>
      )}
    </div>
  );
}

export default ProgressBar;
