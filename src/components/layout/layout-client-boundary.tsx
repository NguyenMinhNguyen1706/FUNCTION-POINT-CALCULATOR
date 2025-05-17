'use client';

import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  AppSidebarNav,
  Toaster
} from './client-layout-parts';

interface LayoutClientBoundaryProps {
  children: ReactNode;
}

export function LayoutClientBoundary({ children }: LayoutClientBoundaryProps) {
  return (
    <>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" className="shadow-md">
          <AppSidebarNav />
        </Sidebar>
        <SidebarInset>
          <main className="min-h-screen p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </>
  );
}
