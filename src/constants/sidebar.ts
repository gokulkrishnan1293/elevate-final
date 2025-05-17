import {
  AudioWaveform,
  Award,
  AwardIcon,
  BookOpen,
  Bot,
  Command,
  DiscAlbum,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  TowerControl,
} from "lucide-react";

export const sidebarLinks = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "Feedback",
    url: "/feedback",
    icon: DiscAlbum,
    isActive: true,
    items: [
      {
        title: "Home",
        url: "/feedback",
      },
    ],
  },
  {
    title: "Events",
    url: "/events",
    icon: TowerControl,
    isActive: true,
    items: [
      {
        title: "Home",
        url: "/events",
      },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings2,
    items: [
      {
        title: "Home",
        url: "/settings",
      },
    ],
  },
];
