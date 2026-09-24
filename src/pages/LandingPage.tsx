import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import BeforeAfterSection from "@/components/landing/BeforeAfterSection";
import TechnologySection from "@/components/landing/TechnologySection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SecuritySection from "@/components/landing/SecuritySection";
import PricingSection from "@/components/landing/PricingSection";
import AboutSection from "@/components/landing/AboutSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaSection from "@/components/landing/CtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[hsl(220,30%,4%)] text-white">
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <BeforeAfterSection />
      <TechnologySection />
      <HowItWorksSection />
      <SecuritySection />
      <PricingSection />
      <AboutSection />
      <FaqSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
