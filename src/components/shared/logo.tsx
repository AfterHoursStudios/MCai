import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Story Studio Logo Component
 *
 * Displays the brand logo with optional text.
 * Supports multiple sizes and links to homepage.
 */
export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 40, text: 'text-2xl' },
  };

  const { icon, text } = sizes[size];

  return (
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 font-semibold transition-opacity hover:opacity-90',
        className
      )}
    >
      {/* Logo Icon */}
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient
            id="logoGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <rect
          width="40"
          height="40"
          rx="10"
          fill="url(#logoGradient)"
        />

        {/* Stylized "S" for Story */}
        <path
          d="M12 14C12 12.8954 12.8954 12 14 12H22C24.2091 12 26 13.7909 26 16C26 18.2091 24.2091 20 22 20H18C15.7909 20 14 21.7909 14 24C14 26.2091 15.7909 28 18 28H26C27.1046 28 28 27.1046 28 26"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Sparkle accent */}
        <circle cx="30" cy="10" r="2" fill="white" opacity="0.8" />
      </svg>

      {/* Logo Text */}
      {showText && (
        <span className={cn('font-bold tracking-tight', text)}>
          Story<span className="text-primary">Studio</span>
        </span>
      )}
    </Link>
  );
}
