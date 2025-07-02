
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, Plus, Settings, File, Users, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isAdmin?: boolean;
}

export function Sidebar({ isOpen, isAdmin = false }: SidebarProps) {
  const location = useLocation();

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/" },
    { icon: FileText, label: "All Layouts", href: "/admin/layouts" },
    { icon: Plus, label: "Generate Layout", href: "/admin/generate" },
    { icon: File, label: "Articles", href: "/admin/articles" },
    { icon: Users, label: "User Portal", href: "/user/" },
    { icon: Settings, label: "Settings", href: "/admin/settings" },
  ];

  const userNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/user/" },
    { icon: BookOpen, label: "Create Magazine", href: "/user/magazine" },
    { icon: Settings, label: "Settings", href: "/user/settings" },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div
      className={cn(
        "bg-sidebar/95 backdrop-blur-sm border-r border-sidebar-border transition-all duration-300 flex flex-col shadow-lg",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-xs">ILD</span>
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sidebar-foreground truncate text-sm">Layout Designer</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {isAdmin ? "Admin Portal" : "User Portal"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 transition-all duration-200 text-sm",
                  !isOpen && "px-2 justify-center",
                  isActive 
                    ? "bg-primary/10 text-primary hover:bg-primary/15 shadow-sm border border-primary/20" 
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                {isOpen && <span className="font-medium">{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-xs">{isAdmin ? "A" : "U"}</span>
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {isAdmin ? "Admin User" : "User"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {isAdmin ? "admin@example.com" : "user@example.com"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
