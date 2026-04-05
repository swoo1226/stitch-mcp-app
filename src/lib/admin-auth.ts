/**
 * @deprecated src/lib/auth.ts를 사용하세요.
 * 이 파일은 기존 import 호환성을 위해 유지됩니다.
 */
export {
  getUserSession as getAdminSession,
  isSuperAdmin,
  isAdmin,
  type UserSession as AdminSession,
  type UserRole as AdminRole,
} from "./auth";
