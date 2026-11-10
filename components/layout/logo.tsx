export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path
        d="M12.5 10.5 7 16l5.5 5.5M19.5 10.5 25 16l-5.5 5.5"
        fill="none"
        className="stroke-accent-fg"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
