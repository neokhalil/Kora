import React from 'react';

interface HamburgerIconProps {
  className?: string;
  size?: number;
}

/**
 * Composant d'icône de hamburger personnalisé avec deux barres
 * La première barre est légèrement plus longue que la seconde
 */
const HamburgerIcon: React.FC<HamburgerIconProps> = ({ 
  className = "", 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Première ligne, plus longue */}
      <line 
        x1="4" 
        y1="8" 
        x2="20" 
        y2="8" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      
      {/* Deuxième ligne, plus courte */}
      <line 
        x1="4" 
        y1="16" 
        x2="16" 
        y2="16" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  );
};

export default HamburgerIcon;