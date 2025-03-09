import React from 'react';

interface BookIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

const BookIcon: React.FC<BookIconProps> = ({ 
  className = "", 
  size = 20, 
  strokeWidth = 2 
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
      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth={strokeWidth} />
      <line x1="9" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="9" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="9" y1="14" x2="15" y2="14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      <line x1="9" y1="18" x2="13" y2="18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
};

export default BookIcon;