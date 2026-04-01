import AdminPageClient from "./AdminPageClient";
import AuthGuard from "../components/AuthGuard";

export default function AdminPage() {
  return (
    <AuthGuard>
      <AdminPageClient />
    </AuthGuard>
  );
}
