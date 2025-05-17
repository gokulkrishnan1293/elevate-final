import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { FlipWords } from "@/components/ui/flip-words";
import { firstSentence, secondSentence } from "@/constants/dashboard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
} from "@/components/ui/carousel";
import { PointerHighlight } from "@/components/ui/pointer-highlight";

const HeroSection = () => {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      orientation="vertical"
      className="w-full"
    >
      <CarouselContent className="-mt-1 h-[20rem] md:h-[30rem]">
        <CarouselItem key={"hero-section"}>
          <BackgroundBeamsWithCollision className="h-[20rem] md:h-[30rem]">
            <h2 className="text-2xl relative z-20 md:text-4xl lg:text-7xl font-bold text-center text-black dark:text-white font-sans tracking-tight">
              <FlipWords
                words={firstSentence}
                className="text-slate-600"
                duration={4000}
              />{" "}
              <FlipWords
                words={secondSentence}
                className="text-teal-400"
                duration={4000}
              />
            </h2>
          </BackgroundBeamsWithCollision>
        </CarouselItem>
      </CarouselContent>
      <CarouselNext />
    </Carousel>
  );
};

export default HeroSection;
