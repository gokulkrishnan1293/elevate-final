import HeroSection from "@/features/dashboard/herosection/HeroSection";
import ProfileCard from "@/features/dashboard/profile/Profile";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="grid auto-rows-min gap-4 md:grid-cols-1">
        <HeroSection />
      </div>
      <div className="grid auto-rows-min gap-2 md:grid-cols-4">
        <ProfileCard />
        <div className="flex-1 rounded-xl bg-muted/50 h-auto col-span-2"></div>
        <div className="flex-1 rounded-xl bg-muted/50 h-auto"></div>
        <div className="flex-1 rounded-xl bg-muted/50 h-auto"></div>
      </div>
      <div className="flex-1 rounded-xl bg-muted/50 min-h-screen"></div>
    </div>
  );
}
