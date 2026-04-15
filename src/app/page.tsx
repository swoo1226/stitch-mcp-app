import { getUserSession } from "../lib/auth";

// Components
import LandingHeader from "./components/landing/LandingHeader";
import LandingHero from "./components/landing/LandingHero";
import LandingHowItWorks from "./components/landing/LandingHowItWorks";
import LandingWeatherStates from "./components/landing/LandingWeatherStates";
import LandingInsightsPreview from "./components/landing/LandingInsightsPreview";
import LandingCTABanner from "./components/landing/LandingCTABanner";
import LandingFooter from "./components/landing/LandingFooter";

export default async function LandingPage() {
  const userSession = await getUserSession();
  const isAdmin = userSession?.role === "super_admin" || userSession?.role === "team_admin";

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--surface)" }}
    >
      <LandingHeader 
        isAdmin={isAdmin} 
        userSession={userSession} 
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
