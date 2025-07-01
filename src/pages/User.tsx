
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/pages/Dashboard";
import { Articles } from "@/components/pages/Articles";
import { ArticleDetails } from "@/components/pages/ArticleDetails";
import { ArticleCreatePage } from "@/components/pages/ArticleCreate";

const User = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-background flex w-full">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} isAdmin={false} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/:id" element={<ArticleDetails />} />
            <Route path="articles/create" element={<ArticleCreatePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default User;
