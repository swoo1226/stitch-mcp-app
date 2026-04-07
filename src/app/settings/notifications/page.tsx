import AuthGuard from "../../components/AuthGuard";
import NotificationsSettingsPageClient from "./NotificationsSettingsPageClient";

export const dynamic = "force-dynamic";

export default function NotificationSettingsPage() {
  return (
    <AuthGuard>
      <NotificationsSettingsPageClient />
    </AuthGuard>
  );
}
