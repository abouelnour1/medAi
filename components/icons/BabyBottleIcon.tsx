
import React from 'react';

const BabyBottleIcon: React.FC = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className="h-full w-full" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={2}
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Cap/Teat */}
    <path d="M9 6h6" />
    <path d="M10 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
    
    {/* Bottle Body */}
    <path d="M8 6h8l1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L8 6z" />
    
    {/* Measurement Marks */}
    <path d="M14 10h-2" />
    <path d="M14 13h-2" />
    <path d="M14 16h-2" />
  </svg>
);

export default BabyBottleIcon;
