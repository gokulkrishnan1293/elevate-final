import type { Metadata } from "next";
import "./globals.css";
import { AppSideBar } from "@/components";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AuthProvider from "@/features/authentication/provider/AuthProvider";

export const metadata: Metadata = {
  title: "Elevate",
  description: "Empowering your feedback process",
  icons: {
    icon: "/elevate.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SidebarProvider>
            <AppSideBar />
            <SidebarInset>
              <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-white">
                <div className="flex w-full">
                  <div className="flex items-start gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                  </div>
                </div>
              </header>
              <main>{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
