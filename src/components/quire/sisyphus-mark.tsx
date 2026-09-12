/** Filled statue, stone, and slope — a stamp of the climb, not an outline. */
export function SisyphusMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        opacity="0.28"
        d="M0 58c4-6 10-6 14-2 4-7 12-7 16-1 4-7 12-6 16 0 4-6 10-6 14-1 3-5 4-4 4 2v8H0z"
      />
      <path fill="currentColor" d="M4 62 14 49 30 36 42 31 51 30 62 37v25z" />
      <circle cx="43.2" cy="18.6" r="14.4" fill="currentColor" />
      <g fill="currentColor">
        <path d="M15.8 24.97 19.6 38.97A5.6 5.6 0 0 1 30.4 36.03L26.6 22.03A5.6 5.6 0 0 1 15.8 24.97Z" />
        <path d="M25.54 27.35 41.24 22.75A3.7 3.7 0 0 1 39.16 15.65L23.46 20.25A3.7 3.7 0 0 1 25.54 27.35Z" />
        <path d="M39.11 22.73 43.61 21.73A2.8 2.8 0 0 1 42.39 16.27L37.89 17.27A2.8 2.8 0 0 1 39.11 22.73Z" />
        <path d="M19.75 36.53 7.85 52.53A3.3 3.3 0 0 1 13.15 56.47L25.05 40.47A3.3 3.3 0 0 1 19.75 36.53Z" />
        <path d="M23.3 40.26 31.1 49.46A3.8 3.8 0 0 1 36.9 44.54L29.1 35.34A3.8 3.8 0 0 1 23.3 40.26Z" />
        <path d="M30.96 45.39 26.56 54.99A2.9 2.9 0 0 1 31.84 57.41L36.24 47.81A2.9 2.9 0 0 1 30.96 45.39Z" />
        <circle cx="24.6" cy="37.8" r="4.4" />
        <circle cx="22.2" cy="23.8" r="4" />
        <circle cx="23.4" cy="16.8" r="5.4" />
      </g>
    </svg>
  );
}
