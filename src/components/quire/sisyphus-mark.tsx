/** Figure, stone, and slope — a stamp of the climb, not a copy of any vase. */
export function SisyphusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M0 64V48L64 22v42z" fill="currentColor" opacity="0.2" />
      <path
        d="M0 48 L64 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="42.2" cy="21.2" r="15.2" fill="currentColor" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.4"
        d="M33.4 14.6c3.2-3.8 9.2-5 14.2-2"
      />
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -3.2)">
        <path strokeWidth="5.4" d="M16.8 29.2 L18.4 36.4" />
        <path strokeWidth="4.6" d="M17.4 30.2 L27.2 23.6" />
        <path strokeWidth="4.5" d="M18.2 36.2 L10.2 45.6" />
        <path strokeWidth="4.5" d="M18.2 36.2 L24.2 40.2 L19.6 48.4" />
      </g>
      <circle cx="16.2" cy="21.4" r="4.4" fill="currentColor" />
      <circle cx="18.4" cy="33.4" r="3.1" fill="currentColor" />
    </svg>
  );
}
