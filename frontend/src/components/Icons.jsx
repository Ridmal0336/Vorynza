const base = {
  width: 28,
  height: 28,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function SearchIcon(props) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16.2 16.2 4.3 4.3" />
    </svg>
  );
}

export function PackageIcon(props) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M3 7.5 12 3l9 4.5v9L12 21 3 16.5z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </svg>
  );
}

export function HallIcon(props) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <path d="M3 21h18M5 21V9l7-5 7 5v12" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function CalendarIcon(props) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="1" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function UsersIcon(props) {
  return (
    <svg {...base} {...props} aria-hidden="true">
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <path d="M16.5 5.2a3.4 3.4 0 0 1 0 6.4M18 13.9c2.1.8 3.5 2.8 3.5 5.1" />
    </svg>
  );
}

export function MenuIcon(props) {
  return (
    <svg {...base} width={20} height={20} {...props} aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...base} width={20} height={20} {...props} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function PinIcon(props) {
  return (
    <svg {...base} width={14} height={14} strokeWidth={1.6} {...props} aria-hidden="true">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function StarIcon(props) {
  return (
    <svg
      {...base}
      width={14}
      height={14}
      fill="currentColor"
      stroke="none"
      {...props}
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5-4.8-4.6 6.6-.9z" />
    </svg>
  );
}
