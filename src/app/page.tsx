"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getUserSession, type UserSession } from "../lib/auth";

// Components
import LandingHeader from "./components/landing/LandingHeader";
import LandingHero from "./components/landing/LandingHero";
import LandingHowItWorks from "./components/landing/LandingHowItWorks";
import LandingWeatherStates from "./components/landing/LandingWeatherStates";
import LandingInsightsPreview from "./components/landing/LandingInsightsPreview";
import LandingCTABanner from "./components/landing/LandingCTABanner";
import LandingFooter from "./components/landing/LandingFooter";

export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  useEffect(() => {
    getUserSession().then(setUserSession);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUserSession().then(setUserSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = userSession?.role === "super_admin" || userSession?.role === "team_admin";

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--surface)" }}
    >
      <LandingHeader 
        isAdmin={isAdmin} 
        userSession={userSession} 
        mobileNavOpen={mobileNavOpen} 
        setMobileNavOpen={setMobileNavOpen} 
      />

      <main>
        <LandingHero />
        <LandingHowItWorks />
        <LandingWeatherStates />
        <LandingInsightsPreview />
        <LandingCTABanner />
      </main>

      <LandingFooter />
    </div>
  );
}
