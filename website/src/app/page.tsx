import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { BrandMarquee } from "@/components/BrandMarquee";
import { PartnerMarquee } from "@/components/PartnerMarquee";
import { RichardMilleSlider } from "@/components/RichardMilleSlider";
import { Features } from "@/components/Features";
import { TrustPlatform } from "@/components/TrustPlatform";
import { AppShowcase } from "@/components/AppShowcase";
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
        <TrustPlatform />
        <AppShowcase />
        <HowItWorks />
        <Download />
      </main>
      <Footer />
    </>
  );
}
