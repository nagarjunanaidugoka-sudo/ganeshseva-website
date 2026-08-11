interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

// Stylized Lord Ganesha silhouette
export function GaneshaArt({ className = '', style }: IconProps) {
  return (
    <svg viewBox="0 0 240 260" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="gan-halo" cx="50%" cy="38%" r="55%">
          <stop offset="0%" stopColor="#ffe9b0" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#ffbf70" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ff8411" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gan-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5933a" />
          <stop offset="100%" stopColor="#b8420f" />
        </linearGradient>
        <linearGradient id="gan-tusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8e6" />
          <stop offset="100%" stopColor="#f0d8a0" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="105" r="92" fill="url(#gan-halo)" />
      <path d="M120 18l10 18 14-12 4 22 18-8-6 22 16 6-16 12 8 20-24-8-8 18-14-14-14 14-8-18-24 8 8-20-16-12 16-6-6-22 18 8 4-22 14 12z" fill="#d9942a" stroke="#8a5a14" strokeWidth="1.5" />
      <circle cx="120" cy="40" r="6" fill="#fff3c4" />
      <ellipse cx="120" cy="92" rx="52" ry="46" fill="url(#gan-body)" stroke="#7a2a08" strokeWidth="2" />
      <path d="M70 88c-18-2-30 8-26 22 4 12 20 14 30 6z" fill="#c66a1c" stroke="#7a2a08" strokeWidth="1.5" />
      <path d="M170 88c18-2 30 8 26 22-4 12-20 14-30 6z" fill="#c66a1c" stroke="#7a2a08" strokeWidth="1.5" />
      <path d="M120 118c-6 16-2 30 8 34 8 3 16-2 14-12-2-8-10-8-12-2-2 4 2 8 6 6" fill="url(#gan-body)" stroke="#7a2a08" strokeWidth="2" />
      <path d="M104 116c-6 8-8 18-2 24 4-6 6-14 6-22z" fill="url(#gan-tusk)" stroke="#caa760" strokeWidth="1" />
      <path d="M136 116c6 8 8 18 2 24-4-6-6-14-6-22z" fill="url(#gan-tusk)" stroke="#caa760" strokeWidth="1" />
      <circle cx="104" cy="86" r="5" fill="#fff8e6" />
      <circle cx="104" cy="86" r="2.5" fill="#3a1a08" />
      <circle cx="136" cy="86" r="5" fill="#fff8e6" />
      <circle cx="136" cy="86" r="2.5" fill="#3a1a08" />
      <path d="M120 64l-4 14 8 0z" fill="#ab2323" />
      <circle cx="120" cy="78" r="3" fill="#fffbf2" />
      <path d="M70 150c-20 16-28 44-22 70 6 22 30 30 72 30s66-8 72-30c6-26-2-54-22-70-14 10-32 14-50 14s-36-4-50-14z" fill="url(#gan-body)" stroke="#7a2a08" strokeWidth="2" />
      <path d="M64 196c36 14 76 14 112 0" stroke="#d9942a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M62 168c-16 4-26 16-22 30 8-4 16-14 22-26z" fill="#c66a1c" stroke="#7a2a08" strokeWidth="1.5" />
      <path d="M178 168c16 4 26 16 22 30-8-4-16-14-22-26z" fill="#c66a1c" stroke="#7a2a08" strokeWidth="1.5" />
      <circle cx="48" cy="196" r="8" fill="#fff3c4" stroke="#caa760" strokeWidth="1.5" />
      <path d="M44 190c4-4 8-4 8 0" stroke="#caa760" strokeWidth="1.5" fill="none" />
      <path d="M120 252c-30 0-54-4-54-4 4-8 16-12 54-12s50 4 54 12c0 0-24 4-54 4z" fill="#ab2323" stroke="#771f1f" strokeWidth="1.5" />
      <path d="M66 248c6-10 18-14 54-14s48 4 54 14" stroke="#d9942a" strokeWidth="2" fill="none" />
    </svg>
  );
}

// Intricate mandala pattern
export function Mandala({ className = '', style }: IconProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="100" cy="100" r="96" />
        <circle cx="100" cy="100" r="78" />
        <circle cx="100" cy="100" r="58" />
        <circle cx="100" cy="100" r="38" />
        <circle cx="100" cy="100" r="18" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i * Math.PI) / 8;
          const x1 = 100 + Math.cos(a) * 18;
          const y1 = 100 + Math.sin(a) * 18;
          const x2 = 100 + Math.cos(a) * 96;
          const y2 = 100 + Math.sin(a) * 96;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          const cx = 100 + Math.cos(a) * 68;
          const cy = 100 + Math.sin(a) * 68;
          return <circle key={i} cx={cx} cy={cy} r="14" />;
        })}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI) / 6;
          const cx = 100 + Math.cos(a) * 48;
          const cy = 100 + Math.sin(a) * 48;
          return <circle key={i} cx={cx} cy={cy} r="6" />;
        })}
      </g>
    </svg>
  );
}

// Marigold flower
export function Marigold({ className = '', style }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="mar-petal" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffd27a" />
          <stop offset="60%" stopColor="#ff9d38" />
          <stop offset="100%" stopColor="#e06806" />
        </radialGradient>
      </defs>
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const x = 50 + Math.cos(a) * 22;
        const y = 50 + Math.sin(a) * 22;
        return (
          <ellipse key={i} cx={x} cy={y} rx="10" ry="16" transform={`rotate(${i * 30} ${x} ${y})`} fill="url(#mar-petal)" opacity="0.92" />
        );
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = ((i * 30 + 15) * Math.PI) / 180;
        const x = 50 + Math.cos(a) * 14;
        const y = 50 + Math.sin(a) * 14;
        return (
          <ellipse key={`b-${i}`} cx={x} cy={y} rx="7" ry="11" transform={`rotate(${i * 30 + 15} ${x} ${y})`} fill="#ffbf70" opacity="0.9" />
        );
      })}
      <circle cx="50" cy="50" r="9" fill="#b8420f" />
      <circle cx="50" cy="50" r="5" fill="#7a2a08" />
    </svg>
  );
}

// Marigold garland string
export function Garland({ className = '', style }: IconProps) {
  return (
    <svg viewBox="0 0 600 60" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden preserveAspectRatio="none">
      <path d="M0 30 Q 30 6 60 30 T 120 30 T 180 30 T 240 30 T 300 30 T 360 30 T 420 30 T 480 30 T 540 30 T 600 30" fill="none" stroke="#8a5a14" strokeWidth="2" />
      {Array.from({ length: 20 }).map((_, i) => {
        const x = i * 30 + 8;
        const y = 30 + (i % 2 === 0 ? -8 : 8);
        return <circle key={i} cx={x} cy={y} r="9" fill={i % 2 === 0 ? '#ff9d38' : '#ffd27a'} stroke="#b8420f" strokeWidth="1" />;
      })}
    </svg>
  );
}

// Diya (oil lamp) with flame
export function Diya({ className = '', style }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="diya-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff8411" />
          <stop offset="60%" stopColor="#ffcf6a" />
          <stop offset="100%" stopColor="#fff3c4" />
        </linearGradient>
        <linearGradient id="diya-bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c47a20" />
          <stop offset="100%" stopColor="#7a3a10" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="26" r="20" fill="#ffcf6a" opacity="0.35" />
      <path d="M40 8c4 6 8 10 6 16-2 5-10 5-12 0-2-6 2-10 6-16z" fill="url(#diya-flame)" />
      <path d="M40 16c2 3 4 5 3 8-1 3-5 3-6 0-1-3 1-5 3-8z" fill="#fff3c4" />
      <path d="M10 44c0 14 14 22 30 22s30-8 30-22z" fill="url(#diya-bowl)" />
      <ellipse cx="40" cy="44" rx="30" ry="6" fill="#5a2a08" />
      <ellipse cx="40" cy="43" rx="26" ry="4" fill="#3a1a08" />
      <path d="M8 44h64l-4 6H12z" fill="#d9942a" />
    </svg>
  );
}

// Lotus motif
export function Lotus({ className = '', style }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <linearGradient id="lotus-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ab2323" />
          <stop offset="100%" stopColor="#f299b8" />
        </linearGradient>
      </defs>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        const x = 50 + Math.cos(a) * 18;
        const y = 50 + Math.sin(a) * 18;
        return (
          <ellipse key={i} cx={x} cy={y} rx="12" ry="26" transform={`rotate(${i * 45} ${x} ${y})`} fill="url(#lotus-grad)" opacity="0.85" />
        );
      })}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = ((i * 45 + 22.5) * Math.PI) / 180;
        const x = 50 + Math.cos(a) * 12;
        const y = 50 + Math.sin(a) * 12;
        return (
          <ellipse key={`b-${i}`} cx={x} cy={y} rx="8" ry="18" transform={`rotate(${i * 45 + 22.5} ${x} ${y})`} fill="#f7c6d9" opacity="0.8" />
        );
      })}
      <circle cx="50" cy="50" r="8" fill="#d9942a" />
      <circle cx="50" cy="50" r="4" fill="#fff3c4" />
    </svg>
  );
}

// Om symbol
export function OmSymbol({ className = '', style }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden fill="currentColor">
      <path d="M30 62c-6-8-2-20 8-22 10-2 18 4 18 12 0 6-4 10-10 10-4 0-7-2-8-6-1-4 2-8 6-8 3 0 5 2 5 4M50 38c0-8 8-14 16-12 6 1 10 6 10 12 0 6-5 10-11 10-3 0-6-1-8-4M44 76c10 0 18-6 18-14 0-10-10-16-22-16-8 0-14 4-14 10 0 4 3 7 7 7 3 0 6-2 6-5 0-2-2-4-4-4M60 24a4 4 0 110-8 4 4 0 010 8z" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Swastika auspicious symbol (Hindu)
export function Swastika({ className = '', style }: IconProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden fill="currentColor">
      <path d="M20 20h60v8H28v52h52v-32H44v8h20v8H44V36h36v44H20z" />
    </svg>
  );
}
