import { motion } from "motion/react";
import { useSidebar } from "../ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import { Cover } from "@/components/ui/cover";

const HeaderLogo = () => {
  const sidebarState = useSidebar();

  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <Image src="/elevate.svg" alt="Elevate Logo" width={28} height={28} />
      {sidebarState.open && (
        <Cover className="text-3xl font-semibold animated-gradient-text">
          Elevate
        </Cover>
      )}
    </Link>
  );
};

export default HeaderLogo;
