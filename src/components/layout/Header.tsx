
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { ProfileDropdown } from "./ProfileDropdown";
import ildLogo from "@/assets/ild-logo.png";

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = true }: HeaderProps) {
  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border/50 px-6 py-3 shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onMenuClick} 
              className="lg:hidden hover:bg-muted/80"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/30e0e1ea-c234-4656-a4db-bf73b7505308.png" 
              alt="ILD Logo" 
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-semibold text-foreground">
              Intelligent Layout Design
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
