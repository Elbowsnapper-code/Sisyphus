/** Mountain + worn cobble on the climb — peak stays empty so it cannot read as a sun. */
export function SisyphusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M1.7 30.2 H30.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path d="M2.8 30.2 L11.2 13.6 L22.4 6.6 L29.4 30.2 Z" fill="currentColor" opacity="0.16" />
      <path
        d="M2.8 30.2 L11.2 13.6 L22.4 6.6 L29.4 30.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M11.2 13.6 L16.2 30.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.05"
        opacity="0.32"
      />
      <path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        d="M6.6 16.2 L5.2 12.2 L7.4 7.6 L12.2 5.8 L16.8 7.4 L17.4 12 L13.6 16.4 L9.2 17 Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinecap="round"
        opacity="0.38"
        d="M8.2 10.2 L11.6 8.6 L14.6 10.8"
      />
    </svg>
  );
}
