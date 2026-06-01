import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BrandMarquee } from "@/components/BrandMarquee";
import { PartnerMarquee } from "@/components/PartnerMarquee";
import { RichardMilleSlider } from "@/components/RichardMilleSlider";
import { Features } from "@/components/Features";
import { PlatformHighlights } from "@/components/PlatformHighlights";
import { TrustPlatform } from "@/components/TrustPlatform";
import { AppShowcase } from "@/components/AppShowcase";
import { Community } from "@/components/Community";
import { HowItWorks } from "@/components/HowItWorks";
import { Download } from "@/components/Download";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <BrandMarquee />
        <PartnerMarquee />
        <RichardMilleSlider />
        <Features />
        <PlatformHighlights />
        <TrustPlatform />
        <AppShowcase />
        <Community />
        <HowItWorks />
        <Download />
      </main>
      <Footer />
    </>
  );
}
