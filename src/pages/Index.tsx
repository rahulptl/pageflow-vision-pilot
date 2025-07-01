
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/pages/Dashboard";
import { LayoutBrowser } from "@/components/pages/LayoutBrowser";
import { LayoutDetails } from "@/components/pages/LayoutDetails";
import { GenerateLayout } from "@/components/pages/GenerateLayout";
import { Articles } from "@/components/pages/Articles";
import { ArticleDetails } from "@/components/pages/ArticleDetails";
import { ArticleCreatePage } from "@/components/pages/ArticleCreate";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="layouts" element={<LayoutBrowser />} />
            <Route path="layouts/:id" element={<LayoutDetails />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/:id" element={<ArticleDetails />} />
            <Route path="articles/create" element={<ArticleCreatePage />} />
            <Route path="generate" element={<GenerateLayout />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Index;
