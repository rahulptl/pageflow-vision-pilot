
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, Menu } from "lucide-react";

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
          
          <div className="relative max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search layouts..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 h-9 w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-xs">A</span>
          </div>
        </div>
      </div>
    </header>
  );
}
