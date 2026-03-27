"use client";

// 디자인 스크린 기반 날씨 아이콘 SVG 컴포넌트

interface IconProps {
  size?: number;
}

export function IconSunny({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="10" fill="#F5A623" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line
          key={i}
          x1="24" y1="6"
          x2="24" y2="11"
          stroke="#F5A623"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="10" fill="url(#sunGrad)" />
      <defs>
        <radialGradient id="sunGrad" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#F5A623" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function IconCloudy({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <circle cx="20" cy="26" r="9" fill="url(#cloudGrad1)" />
      <circle cx="30" cy="28" r="7" fill="url(#cloudGrad1)" />
      <circle cx="26" cy="22" r="8" fill="url(#cloudGrad1)" />
      <rect x="12" y="28" width="24" height="8" rx="4" fill="url(#cloudGrad1)" />
      <defs>
        <linearGradient id="cloudGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fd4f0" />
          <stop offset="100%" stopColor="#74b9e8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconFoggy({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 구름 */}
      <circle cx="19" cy="20" r="7" fill="#9aa5b4" />
      <circle cx="28" cy="21" r="6" fill="#9aa5b4" />
      <circle cx="24" cy="17" r="7" fill="#9aa5b4" />
      <rect x="13" y="22" width="22" height="6" rx="3" fill="#9aa5b4" />
      {/* 안개 선 */}
      <rect x="10" y="31" width="18" height="2.5" rx="1.25" fill="#b0bac4" opacity="0.8"/>
      <rect x="20" y="36" width="18" height="2.5" rx="1.25" fill="#b0bac4" opacity="0.6"/>
    </svg>
  );
}

export function IconRainy({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 구름 */}
      <circle cx="19" cy="18" r="7" fill="url(#rainCloud)" />
      <circle cx="28" cy="19" r="6" fill="url(#rainCloud)" />
      <circle cx="24" cy="15" r="7" fill="url(#rainCloud)" />
      <rect x="13" y="20" width="22" height="6" rx="3" fill="url(#rainCloud)" />
      {/* 빗방울 */}
      <line x1="16" y1="30" x2="14" y2="38" stroke="#5b9bd5" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="24" y1="30" x2="22" y2="38" stroke="#5b9bd5" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="32" y1="30" x2="30" y2="38" stroke="#5b9bd5" strokeWidth="2.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="rainCloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7f8fa6" />
          <stop offset="100%" stopColor="#636e72" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconStormy({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 어두운 구름 */}
      <circle cx="19" cy="17" r="7" fill="url(#stormCloud)" />
      <circle cx="28" cy="18" r="6" fill="url(#stormCloud)" />
      <circle cx="24" cy="14" r="7" fill="url(#stormCloud)" />
      <rect x="13" y="19" width="22" height="6" rx="3" fill="url(#stormCloud)" />
      {/* 번개 */}
      <path d="M26 27 L21 35 L25 35 L20 44 L30 33 L26 33 Z" fill="#F5A623" />
      <defs>
        <linearGradient id="stormCloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d3436" />
          <stop offset="100%" stopColor="#1e272e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconRadiant({ size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 글로우 */}
      <circle cx="24" cy="24" r="16" fill="#FFE066" opacity="0.25" />
      <circle cx="24" cy="24" r="11" fill="url(#radiantGrad)" />
      {[0,40,80,120,160,200,240,280,320].map((deg, i) => (
        <line
          key={i}
          x1="24" y1="5"
          x2="24" y2="10"
          stroke="#FFD166"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
      <defs>
        <radialGradient id="radiantGrad" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#FFE599" />
          <stop offset="100%" stopColor="#F5A623" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export const WEATHER_ICON_MAP: Record<string, React.FC<IconProps>> = {
  Sunny:   IconSunny,
  Cloudy:  IconCloudy,
  Foggy:   IconFoggy,
  Rainy:   IconRainy,
  Stormy:  IconStormy,
  Radiant: IconRadiant,
};
