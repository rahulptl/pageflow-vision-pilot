import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/pages/Dashboard";
import { LayoutBrowser } from "@/components/pages/LayoutBrowser";
import { LayoutDetails } from "@/components/pages/LayoutDetails";
import { GenerateLayout } from "@/components/pages/GenerateLayout";
import { Articles } from "@/components/pages/Articles";
import { ArticleDetails } from "@/components/pages/ArticleDetails";
import { ArticleCreatePage } from "@/components/pages/ArticleCreate";
import { MagazineForm } from "@/components/MagazineForm";
import { ImageGeneration } from "@/components/pages/ImageGeneration";

interface AppLayoutProps {
  isAdmin: boolean;
  baseRoute: string;
}

export function AppLayout({ isAdmin, baseRoute }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Articles - Admin: full CRUD, User: read/search only */}
            <Route path="articles" element={<Articles isAdmin={isAdmin} />} />
            <Route path="articles/:id" element={<ArticleDetails isAdmin={isAdmin} />} />
            
            {/* Magazines - Admin: full CRUD, User: create only */}
            <Route path="magazines" element={<MagazineForm />} />
            
            {/* Image Generation - Available to both Admin and User */}
            <Route path="image-generation" element={<ImageGeneration isAdmin={isAdmin} />} />
            
            {/* Admin-only routes - Layouts */}
            {isAdmin && (
              <>
                <Route path="layouts" element={<LayoutBrowser />} />
                <Route path="layouts/:id" element={<LayoutDetails />} />
                <Route path="generate" element={<GenerateLayout />} />
                <Route path="articles/create" element={<ArticleCreatePage />} />
              </>
            )}
            
            {/* Redirect any invalid routes back to base */}
            <Route path="*" element={<Navigate to={baseRoute} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}