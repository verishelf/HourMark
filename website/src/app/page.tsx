import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { AppShowcase } from "@/components/AppShowcase";
import { TechStack } from "@/components/TechStack";
import { Download } from "@/components/Download";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <AppShowcase />
        <TechStack />
        <Download />
      </main>
      <Footer />
    </>
  );
}
