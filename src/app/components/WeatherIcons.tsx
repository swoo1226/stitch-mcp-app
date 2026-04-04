"use client";

import { useId } from "react";

// 날씨 아이콘 SVG 컴포넌트
// 단계: 뇌우(Stormy) → 비(Rainy) → 흐림(Cloudy) → 구름조금(PartlyCloudy) → 맑음(Sunny)

interface IconProps {
  size?: number;
}

// ─── 맑음 (Sunny) ─────────────────────────────────────────────────────────────
export function IconSunny({ size = 48 }: IconProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `sunGrad-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
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
      <circle cx="24" cy="24" r="10" fill={`url(#${gradId})`} />
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#F5A623" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── 구름조금 (PartlyCloudy) ──────────────────────────────────────────────────
export function IconPartlyCloudy({ size = 48 }: IconProps) {
  const uid = useId().replace(/:/g, '');
  const sunGrad = `pcSunGrad-${uid}`;
  const cloudGrad = `pcCloudGrad-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 태양 (왼쪽 상단) */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <line
          key={i}
          x1="16" y1="6"
          x2="16" y2="9.5"
          stroke="#F5A623"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="6.5" fill={`url(#${sunGrad})`} />
      {/* 구름 (오른쪽 하단으로 살짝 이동) */}
      <circle cx="23" cy="30" r="8" fill={`url(#${cloudGrad})`} />
      <circle cx="32" cy="32" r="6.5" fill={`url(#${cloudGrad})`} />
      <circle cx="28" cy="26.5" r="7.5" fill={`url(#${cloudGrad})`} />
      <rect x="16" y="32" width="21" height="7" rx="3.5" fill={`url(#${cloudGrad})`} />
      <defs>
        <radialGradient id={sunGrad} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#FFE166" />
          <stop offset="100%" stopColor="#F5A623" />
        </radialGradient>
        <linearGradient id={cloudGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bdd8ee" />
          <stop offset="100%" stopColor="#90bde0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── 흐림 (Cloudy) ────────────────────────────────────────────────────────────
export function IconCloudy({ size = 48 }: IconProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `cloudGrad-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 뒤쪽 구름 (더 밝음) */}
      <circle cx="30" cy="22" r="7" fill="#c8d9e8" />
      <circle cx="38" cy="25" r="5.5" fill="#c8d9e8" />
      <rect x="24" y="25" width="19" height="7" rx="3.5" fill="#c8d9e8" />
      {/* 앞쪽 구름 */}
      <circle cx="20" cy="26" r="9" fill={`url(#${gradId})`} />
      <circle cx="30" cy="28" r="7" fill={`url(#${gradId})`} />
      <circle cx="26" cy="22" r="8" fill={`url(#${gradId})`} />
      <rect x="12" y="28" width="24" height="8" rx="4" fill={`url(#${gradId})`} />
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9ab8cc" />
          <stop offset="100%" stopColor="#7499b0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── 비 (Rainy) ───────────────────────────────────────────────────────────────
export function IconRainy({ size = 48 }: IconProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `rainCloud-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 구름 */}
      <circle cx="19" cy="18" r="7" fill={`url(#${gradId})`} />
      <circle cx="28" cy="19" r="6" fill={`url(#${gradId})`} />
      <circle cx="24" cy="15" r="7" fill={`url(#${gradId})`} />
      <rect x="13" y="20" width="22" height="6" rx="3" fill={`url(#${gradId})`} />
      {/* 빗방울 */}
      <line x1="16" y1="30" x2="14" y2="38" stroke="#5b9bd5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="30" x2="22" y2="38" stroke="#5b9bd5" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="30" x2="30" y2="38" stroke="#5b9bd5" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7f8fa6" />
          <stop offset="100%" stopColor="#636e72" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── 뇌우 (Stormy) ────────────────────────────────────────────────────────────
export function IconStormy({ size = 48 }: IconProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `stormCloud-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* 어두운 구름 */}
      <circle cx="19" cy="17" r="7" fill={`url(#${gradId})`} />
      <circle cx="28" cy="18" r="6" fill={`url(#${gradId})`} />
      <circle cx="24" cy="14" r="7" fill={`url(#${gradId})`} />
      <rect x="13" y="19" width="22" height="6" rx="3" fill={`url(#${gradId})`} />
      {/* 번개 */}
      <path d="M26 27 L21 35 L25 35 L20 44 L30 33 L26 33 Z" fill="#F5A623" />
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d3436" />
          <stop offset="100%" stopColor="#1e272e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const WEATHER_ICON_MAP: Record<string, React.FC<IconProps>> = {
  Sunny:        IconSunny,
  PartlyCloudy: IconPartlyCloudy,
  Cloudy:       IconCloudy,
  Rainy:        IconRainy,
  Stormy:       IconStormy,
};
