const PALETTES = {
  1: { main: '#E8C66A', hi: '#FFF1B8', dark: '#B68A2B' },
  2: { main: '#BFC9D9', hi: '#F1F5F9', dark: '#8894A7' },
  3: { main: '#C9826B', hi: '#EAB6A5', dark: '#93523F' }
};

export default function RankBadge({ rank }) {
  if (rank > 3) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-standard bg-midnight-card text-xs font-semibold text-text-secondary">
        {rank}
      </div>
    );
  }

  const p = PALETTES[rank];
  const gradId = `rankGrad-${rank}`;

  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-label={`Rank ${rank}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={p.hi} />
          <stop offset="55%" stopColor={p.main} />
          <stop offset="100%" stopColor={p.dark} />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill={`url(#${gradId})`} stroke={p.dark} strokeWidth="1" />
      <circle cx="18" cy="18" r="12.5" fill="none" stroke={p.hi} strokeOpacity="0.5" strokeWidth="1" />
      <text x="18" y="23" textAnchor="middle" fontSize="14" fontWeight="700" fill="#141E33">
        {rank}
      </text>
    </svg>
  );
}
