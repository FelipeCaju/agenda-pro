import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

function createSvg(children: ReactNode, className?: string) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function SearchIcon({ className = "h-5 w-5" }: IconProps) {
  return createSvg(
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>,
    className,
  );
}

export function PhoneIcon({ className = "h-4 w-4" }: IconProps) {
  return createSvg(
    <path d="M5.5 6.5c0 6.1 5.9 12 12 12h1.5a1.5 1.5 0 0 0 1.5-1.5v-2.1a1.5 1.5 0 0 0-1.1-1.4l-2.7-.7a1.5 1.5 0 0 0-1.5.5l-.8 1a11.8 11.8 0 0 1-4.7-4.7l1-.8a1.5 1.5 0 0 0 .5-1.5l-.7-2.7A1.5 1.5 0 0 0 8.6 3.5H6.5A1.5 1.5 0 0 0 5 5v1.5Z" />,
    className,
  );
}

export function MailIcon({ className = "h-4 w-4" }: IconProps) {
  return createSvg(
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="m5 8 7 5 7-5" />
    </>,
    className,
  );
}

export function PlusIcon({ className = "h-4 w-4" }: IconProps) {
  return createSvg(
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>,
    className,
  );
}

export function CalendarIcon({ className = "h-5 w-5" }: IconProps) {
  return createSvg(
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
      <path d="M7.5 3.5v4" />
      <path d="M16.5 3.5v4" />
      <path d="M3.5 9.5h17" />
    </>,
    className,
  );
}

export function ClockIcon({ className = "h-4 w-4" }: IconProps) {
  return createSvg(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.8 1.8" />
    </>,
    className,
  );
}

export function ChevronDownIcon({ className = "h-4 w-4" }: IconProps) {
  return createSvg(<path d="m6 9 6 6 6-6" />, className);
}

export function ChevronLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return createSvg(<path d="m15 6-6 6 6 6" />, className);
}

export function MoneyIcon({ className = "h-5 w-5" }: IconProps) {
  return createSvg(
    <>
      <path d="M12 4v16" />
      <path d="M15.5 7.5c0-1.4-1.6-2.5-3.5-2.5s-3.5 1.1-3.5 2.5S10.1 10 12 10s3.5 1.1 3.5 2.5S13.9 15 12 15s-3.5-1.1-3.5-2.5" />
    </>,
    className,
  );
}

export function TrendIcon({ className = "h-5 w-5" }: IconProps) {
  return createSvg(
    <>
      <path d="m5 16 5-5 3 3 6-7" />
      <path d="M14 7h5v5" />
    </>,
    className,
  );
}

export function ScissorsIcon({ className = "h-5 w-5" }: IconProps) {
  return createSvg(
    <>
      <circle cx="6.5" cy="7" r="2.5" />
      <circle cx="6.5" cy="17" r="2.5" />
      <path d="M20 4 8.3 14.4" />
      <path d="m20 20-8.7-7.8" />
    </>,
    className,
  );
}

export function UsersIcon({ className = "h-5 w-5" }: IconProps) {
  return createSvg(
    <>
      <path d="M9 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M4.5 18a4.5 4.5 0 0 1 9 0" />
      <path d="M16.5 11a2.5 2.5 0 1 0 0-5" />
      <path d="M19.5 18a3.5 3.5 0 0 0-2.7-3.4" />
    </>,
    className,
  );
}

export function EyeIcon({ className = "h-4 w-4" }: IconProps) {
  return createSvg(
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </>,
    className,
  );
}

export function EyeOffIcon({ className = "h-4 w-4" }: IconProps) {
  return createSvg(
    <>
      <path d="M3 3 21 21" />
      <path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a18.7 18.7 0 0 1-3.2 3.9" />
      <path d="M6.2 6.3A18.2 18.2 0 0 0 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3-.4" />
      <path d="M9.9 9.9A3 3 0 0 0 14 14" />
    </>,
    className,
  );
}
