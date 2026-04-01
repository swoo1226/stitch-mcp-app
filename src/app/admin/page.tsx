// app/admin/page.tsx
import { Suspense } from "react";
import AdminPageClient from "./AdminPageClient";
import AuthGuard from "../components/AuthGuard";

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AuthGuard>
        <AdminPageClient />
      </AuthGuard>
    </Suspense>
  );
}