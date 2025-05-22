"use client";

import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

export const AnimatedTooltip = ({
  owners,
}: {
  owners: { ownerName?: string | null | undefined; 
    ownerEmail?: string | null | undefined; 
    ownerAvatar?: string | null | undefined; 
    ownerEmployeeKey?: number | null | undefined; }[];
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null | undefined>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0); // going to set this value on mouse move
  // rotate the tooltip
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  // translate the tooltip
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig,
  );
  const handleMouseMove = (event: any) => {
    const halfWidth = event.target.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth); // set the x value, which is then used in transform and rotate
  };

  return (
    <>
      {owners.map((owner, idx) => (
        <div
          className="group relative -mr-4"
          key={owner.ownerName}
          onMouseEnter={() => setHoveredIndex(owner.ownerEmployeeKey)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === owner.ownerEmployeeKey && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-10 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-xs shadow-xl"
              >
                <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                <div className="relative z-30 text-base font-bold text-white">
                  {owner.ownerName}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
         <Avatar className="h-8 w-8">
            <AvatarImage src={owner.ownerAvatar || undefined} alt={owner.ownerName || "Owner"} />
            <AvatarFallback>
              {owner.ownerName
                ?.split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "O"}
            </AvatarFallback>
          </Avatar>
        </div>
      ))}
    </>
  );
};
