
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Plus, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FileText, label: "All Layouts", href: "/layouts" },
    { icon: Plus, label: "Generate Layout", href: "/generate" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">ILD</span>
          </div>
          {isOpen && (
            <div>
              <h1 className="font-semibold text-sidebar-foreground">Layout Designer</h1>
              <p className="text-xs text-sidebar-foreground/60">Intelligent Layout Designer</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  !isOpen && "px-3 justify-center",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {isOpen && <span>{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-sm">A</span>
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">admin@example.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
