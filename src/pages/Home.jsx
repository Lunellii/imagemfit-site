import HeroSlideshow from "@/components/home/HeroSlideshow";
import HowItWorks from "@/components/home/HowItWorks";
import HomeCategoriesSection from "@/components/home/HomeCategoriesSection";
import CompanySection from "@/components/home/CompanySection";
import AlmirTeaser from "@/components/home/AlmirTeaser";
import PersonalizedFamilyArt from "@/components/home/PersonalizedFamilyArt";
import SculpturesHighlight from "@/components/home/SculpturesHighlight";

export default function Home() {
  return (
    <div>
      <HeroSlideshow />
      <HomeCategoriesSection />
      <SculpturesHighlight />
      <HowItWorks />
      <CompanySection />
      <PersonalizedFamilyArt />
      <AlmirTeaser />
    </div>
  );
}
