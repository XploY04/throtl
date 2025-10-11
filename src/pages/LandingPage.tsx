import { motion } from "framer-motion";
import { HeroSection } from "../components/Hero";
import { FeaturesSection } from "../components/FeaturesSection";
import { CTASection } from "../components/CTASection";
import { Footer } from "../components/Footer";
import { ProblemSection } from "../components/ProblemSection";

export default function LandingPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden text-neutral-100 bg-neutral-950"
    >
      <HeroSection />
      <div className="max-w-7xl mx-auto">
        <FeaturesSection />
        <ProblemSection />
        <CTASection />
      </div>
      <Footer />
    </motion.main>
  );
}
