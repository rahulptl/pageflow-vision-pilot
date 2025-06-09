
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
        "bg-sidebar/95 backdrop-blur-sm border-r border-sidebar-border transition-all duration-300 flex flex-col shadow-lg",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-sm">ILD</span>
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sidebar-foreground truncate">Layout Designer</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Intelligent Layout Designer</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12 transition-all duration-200",
                  !isOpen && "px-3 justify-center",
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 shadow-sm border border-primary/20" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                {isOpen && <span className="font-medium">{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
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
