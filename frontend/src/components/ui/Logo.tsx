interface LogoProps {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      className={className}
    >
      <text x="250" y="210" textAnchor="middle" fontFamily="serif" fontSize="140" fontWeight="300" fill="currentColor">LM</text>
      <text x="250" y="360" textAnchor="middle" fontFamily="serif" fontSize="180" fontWeight="900" fill="currentColor">LS</text>
      <line x1="180" y1="225" x2="320" y2="225" stroke="currentColor" strokeWidth="8"/>
    </svg>
  )
}
