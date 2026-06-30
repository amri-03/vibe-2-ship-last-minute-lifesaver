import React from 'react';

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "w-10 h-10" }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      className={`${className} select-none pointer-events-none`}
      fill="none"
      stroke="currentColor"
      strokeWidth="32"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Life Saver LM/LS Logo"
    >
      {/* Top Left: L */}
      <path d="M 125,75 L 125,195 L 195,195" />
      
      {/* Top Right: M */}
      <path d="M 245,195 L 245,75 L 305,140 L 365,75 L 365,195" />
      
      {/* Middle Dividing Line */}
      <path d="M 90,245 L 410,245" strokeWidth="20" />
      
      {/* Bottom Left: L */}
      <path d="M 125,295 L 125,415 L 195,415" />
      
      {/* Bottom Right: S */}
      <path d="M 365,305 C 365,275 245,275 245,320 C 245,365 365,355 365,400 C 365,435 245,435 245,395" />
    </svg>
  );
}
