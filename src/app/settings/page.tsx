import { Suspense } from "react";
import SettingsPageClient from "./SettingsPageClient";

export const metadata = {
  title: "설정 — Clima",
  description: "앱 설정 및 정보를 확인합니다.",
};

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageClient />
    </Suspense>
  );
}
