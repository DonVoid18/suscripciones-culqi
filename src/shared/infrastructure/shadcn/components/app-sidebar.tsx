"use client"

import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/shared/infrastructure/shadcn/components/ui/sidebar"
import {
  Box,
  GalleryVerticalEnd,
  SquareTerminal
} from "lucide-react"

import { NavMain } from "@/shared/infrastructure/shadcn/components/nav-main"
import { NavProjects } from "@/shared/infrastructure/shadcn/components/nav-projects"
import { NavUser } from "@/shared/infrastructure/shadcn/components/nav-user"
import { TeamSwitcher } from "@/shared/infrastructure/shadcn/components/team-switcher"
import { UserLoged } from "@/shared/infrastructure/types/userLoged"

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    }
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    }
  ],
  projects: [
    {
      name: "Productos",
      url: "/productos",
      icon: Box,
    }
  ],
}

export function AppSidebar({ user, ...props }: { user: UserLoged } & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
