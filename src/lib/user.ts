/** nickname이 있으면 nickname, 없으면 name 반환 */
export function displayName(user: { name?: string | null; nickname?: string | null }): string {
  return user.nickname?.trim() || user.name?.trim() || "";
}
