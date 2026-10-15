import HomeHero from "@/components/home/HomeHero";
import HowItWorks from "@/components/home/HowItWorks";
import HomeCategoriesSection from "@/components/home/HomeCategoriesSection";
import CompanySection from "@/components/home/CompanySection";
import AlmirTeaser from "@/components/home/AlmirTeaser";
import PersonalizedFamilyArt from "@/components/home/PersonalizedFamilyArt";

export default function Home() {
  return (
    <div className="bg-paper font-sans">
      <HomeHero />
      <HomeCategoriesSection />
      <HowItWorks />
      <CompanySection />
      <PersonalizedFamilyArt />
      <AlmirTeaser />
    </div>
  );
}
