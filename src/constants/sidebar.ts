import {
  AudioWaveform,
  Award,
  AwardIcon,
  BookOpen,
  Bot,
  CalendarDays,
  Command,
  DiscAlbum,
  FolderKanban,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  Map,
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
  TowerControl,
  UsersRound,
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
    icon: UsersRound,
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
    icon: CalendarDays,
    isActive: true,
    items: [
      {
        title: "Home",
        url: "/events",
      },
    ],
  },
  {
    title: "Manage",
    url: "/manage",
    icon: FolderKanban,
    isActive:false,
    items: [
      {
        title: "ART",
        url: "/manage/art",
      },
      {
        title: "Team",
        url: "/manage/team",
      },
      {
        title: "Members",
        url: "/manage/members",
      },
    ],
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    isActive:false,
    items: [
      {
        title: "Organization",
        url: "/settings/organization",
      },
      {
        title: "Roles",
        url: "/settings/roles",
      },
      {
        title: "Premissions",
        url: "/settings/premissions",
      },
    ],
  },
];
