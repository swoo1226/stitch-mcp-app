"use client";

import { Suspense } from "react";
import { TeamClimateDashboard } from "../dashboard/page";

export default function TeamPage() {
  return (
    <Suspense>
      <TeamClimateDashboard />
    </Suspense>
  );
}
