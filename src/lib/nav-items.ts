import type { HeaderNavItem } from "../app/components/HeaderNav";
import type { UserRole } from "./auth";

/**
 * 역할에 따라 표시할 네비게이션 항목을 반환한다.
 *
 * - null (비로그인/데모): 개인 현황, 팀, Niko-Niko
 * - member: 개인 현황, 팀, Niko-Niko, 체크인
 * - team_admin / super_admin: member 메뉴 + 어드민
 */
export function getNavItems(role: UserRole | null): HeaderNavItem[] {
  const items: HeaderNavItem[] = [
    ...(role === null ? [{ label: "홈", href: "/" }] : []),
    { label: "개인 현황", href: "/personal" },
    { label: "팀", href: "/dashboard", matchPaths: ["/dashboard", "/team"] },
    { label: "Niko-Niko", href: "/niko", matchPaths: ["/niko"] },
  ];

  if (role === "member" || role === "team_admin" || role === "super_admin") {
    items.push({ label: "체크인", href: "/input" });
  }

  if (role === "team_admin" || role === "super_admin") {
    items.push({ label: "어드민", href: "/admin" });
  }

  if (role === "super_admin") {
    items.push({ label: "도입 요청", href: "/admin/access-requests", matchPaths: ["/admin/access-requests"] });
  }

  return items;
}
