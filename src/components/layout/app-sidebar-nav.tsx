"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FunctionSquare, Calculator, FileScan, History, Settings, BotMessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/fp-calculator', label: 'FP Calculator', icon: FunctionSquare },
  { href: '/cocomo-estimator', label: 'COCOMO II', icon: Calculator },
  { href: '/file-analyzer', label: 'File Analyzer', icon: FileScan },
  { href: '/history', label: 'History', icon: History },
];

export function AppSidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BotMessageSquare className="h-7 w-7 text-primary" />
          <h1 className="text-lg font-semibold group-data-[collapsible=icon]:hidden">FP Suite</h1>
        </Link>
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <Separator className="mb-2"/>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  className={cn(
                    "w-full justify-start",
                    pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                  )}
                  asChild
                  tooltip={item.label}
                >
                  <a>
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto">
        {/* <Button variant="outline" className="w-full group-data-[collapsible=icon]:hidden">
          <Settings className="mr-2 h-4 w-4" /> Settings
        </Button>
        <Button variant="outline" size="icon" className="w-full hidden group-data-[collapsible=icon]:block">
          <Settings className="h-4 w-4" />
        </Button> */}
      </SidebarFooter>
    </>
  );
}
