import React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarProvider } from "@/components/ui/sidebar";
import ProblemsBar from "./ProblemsBar"; 

interface AppSidebarProps {
  onProblemSelect: (problem: any) => void;
}

export function AppSidebar({ onProblemSelect }: AppSidebarProps) {
  return (
      <Sidebar>
      <SidebarHeader className="pt-16"> {/* Add padding-top to push content down */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <a href="#" className="flex items-center">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GalleryVerticalEnd className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Problems</span>
                  <span className="">python</span>
                </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            {/* ProblemsBar component */}
            <ProblemsBar onProblemSelect={onProblemSelect} />
          </SidebarGroup>
        </SidebarContent>

        <SidebarRail />
      </Sidebar>
  );
}
