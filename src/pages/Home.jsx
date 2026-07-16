import HeroSlideshow from "@/components/home/HeroSlideshow";
import HowItWorks from "@/components/home/HowItWorks";
import HomeCategoriesSection from "@/components/home/HomeCategoriesSection";
import CompanySection from "@/components/home/CompanySection";
import AlmirTeaser from "@/components/home/AlmirTeaser";
import FramesHighlights from "@/components/home/FramesHighlights";
import PersonalizedFamilyArt from "@/components/home/PersonalizedFamilyArt";

export default function Home() {
  return (
    <div>
      <HeroSlideshow />
      <PersonalizedFamilyArt />
      <AlmirTeaser />
      <FramesHighlights />
      <HowItWorks />
      <HomeCategoriesSection />
      <CompanySection />
    </div>
  );
}
