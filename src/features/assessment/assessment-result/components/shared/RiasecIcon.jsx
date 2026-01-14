/**
 * RIASEC Icon Component
 * Displays RIASEC interest icons using local images
 * Requirements: 3.2 - Shared RiasecIcon component
 */

import React from 'react';

/**
 * Icon paths for each RIASEC code
 */
const iconPaths = {
  R: '/assets/RIASEC/Realistic.png',
  I: '/assets/RIASEC/Investigative.png',
  A: '/assets/RIASEC/Artistic.png',
  S: '/assets/RIASEC/Social.png',
  E: '/assets/RIASEC/Enterprising.png',
  C: '/assets/RIASEC/Conventional.png',
};

/**
 * RiasecIcon Component
 * Renders a RIASEC interest icon based on the code
 * 
 * @param {Object} props - Component props
 * @param {string} props.code - RIASEC code (R, I, A, S, E, or C)
 * @param {number} props.size - Icon size in pixels (default: 24)
 * @returns {JSX.Element} - Image element with the RIASEC icon
 */
const RiasecIcon = ({ code, size = 24 }) => {
  const iconPath = iconPaths[code] || iconPaths.R;

  return (
    <img
      src={iconPath}
      alt={`${code} icon`}
      style={{
        width: size + 8,
        height: size + 8,
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  );
};

export default RiasecIcon;
