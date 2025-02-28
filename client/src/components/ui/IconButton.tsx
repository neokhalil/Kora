import React from 'react';
import { cn } from '@/lib/utils';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}

const IconButton = ({ icon, onClick, className }: IconButtonProps) => {
  return (
    <button 
      className={cn(
        "bg-accent hover:bg-gray-200 transition rounded-full p-4 w-16 h-16 flex items-center justify-center text-gray-600",
        className
      )} 
      onClick={onClick}
    >
      {icon}
    </button>
  );
};

export default IconButton;
