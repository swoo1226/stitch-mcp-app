import type { HeaderNavItem } from "../app/components/HeaderNav";
import type { UserRole } from "./auth";

function teamHref(base: string, teamId: string | null) {
  return teamId ? `${base}?team=${teamId}` : base;
}

/**
 * 역할에 따라 표시할 네비게이션 항목을 반환한다.
 *
 * - null (비로그인/데모): 홈, 개인 현황, 팀, Niko-Niko
 * - member: 개인 현황, 팀, Niko-Niko, 체크인
 * - team_admin: 개인 현황(팀 고정), 팀(팀 고정), Niko-Niko(팀 고정), 체크인, 어드민
 * - super_admin: 어드민, 도입 요청 (팀 종속 메뉴 없음)
 */
export function getNavItems(role: UserRole | null, managedTeamId?: string | null): HeaderNavItem[] {
  // super_admin은 팀 종속 메뉴 불필요
  if (role === "super_admin") {
    return [
      { label: "어드민", href: "/admin" },
      { label: "도입 요청", href: "/admin/access-requests", matchPaths: ["/admin/access-requests"] },
    ];
  }

  const teamId = role === "team_admin" ? (managedTeamId ?? null) : null;

  const items: HeaderNavItem[] = [
    ...(role === null ? [{ label: "홈", href: "/" }] : []),
    { label: "개인 현황", href: "/personal" },
    { label: "팀", href: teamHref("/dashboard", teamId), matchPaths: ["/dashboard", "/team"] },
    { label: "Niko-Niko", href: teamHref("/niko", teamId), matchPaths: ["/niko"] },
  ];

  if (role === "member" || role === "team_admin") {
    items.push({ label: "체크인", href: "/input" });
  }

  if (role === "team_admin") {
    items.push({ label: "어드민", href: "/admin" });
  }

  return items;
}
