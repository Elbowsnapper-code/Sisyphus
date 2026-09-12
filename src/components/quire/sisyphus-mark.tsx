/** Mountains, stone, and the horizon — a line mark for the desk. */
export function SisyphusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="6 8 54 48" className={className} aria-hidden="true" fill="none">
      <g stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="19" cy="16.2" r="6.1" />
        <path d="M9 44 L22 25.5 L35 44" />
        <path d="M22 25.5 L25 41" />
        <path d="M28 44 L40 15.2 L47 28 L55 19.5 L61 44" />
        <path d="M40 15.2 L42.2 44" />
        <path d="M55 19.5 L56.4 35" />
        <path d="M11 48 H53" />
        <path d="M17 52.6 H47" />
      </g>
    </svg>
  );
}
