/**
 * EaseRead Logo — SVG recreation of the brand mark.
 * The "n" letterform in blue with a red dot accent.
 */

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({
  className = '',
  size = 36,
  showText = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="EaseRead logo"
      >
        {/* The "n" letterform */}
        <path
          d="M30 85V45C30 30.088 42.088 18 57 18C71.912 18 84 30.088 84 45V85"
          stroke="#0B3CC5"
          strokeWidth="16"
          strokeLinecap="round"
          fill="none"
        />
        <line
          x1="30"
          y1="45"
          x2="30"
          y2="85"
          stroke="#0B3CC5"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Red accent dot */}
        <circle cx="84" cy="12" r="9" fill="#E52535" />
      </svg>
      {showText && (
        <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Ease<span className="text-brand-blue">Read</span>
        </span>
      )}
    </div>
  );
}
