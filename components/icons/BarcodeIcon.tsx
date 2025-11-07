
import React from 'react';

const BarcodeIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 8v8m4-12v16m4-14v12m4-10v8m4-12v16"
    />
  </svg>
);

export default BarcodeIcon;