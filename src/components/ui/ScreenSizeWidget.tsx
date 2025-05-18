"use client"; // If using app directory

import { useEffect, useState } from "react";

const getTailwindBreakpoint = (width: number): string => {
  if (width < 640) return "sm";
  if (width < 768) return "md";
  if (width < 1024) return "lg";
  if (width < 1280) return "xl";
  return "2xl";
};

const ScreenSizeWidget = () => {
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [breakpoint, setBreakpoint] = useState<string>("unknown");

  useEffect(() => {
    const updateSize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setWidth(w);
      setHeight(h);
      setBreakpoint(getTailwindBreakpoint(w));
    };

    updateSize(); // Initial run
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  if (width === null || height === null) return null; // Avoid rendering on SSR

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-sm p-3 rounded-lg shadow-lg z-50">
      <div className="font-semibold">Screen Size</div>
      <div className="text-xs mt-1">
        <div>Width: {width}px</div>
        <div>Height: {height}px</div>
        <div>
          Tailwind:{" "}
          <span className="font-bold text-yellow-300">{breakpoint}</span>
        </div>
      </div>
    </div>
  );
};

export default ScreenSizeWidget;
