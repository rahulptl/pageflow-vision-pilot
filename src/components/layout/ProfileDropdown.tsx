import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User } from "lucide-react";

export function ProfileDropdown() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-0 hover:from-brand-purple/20 hover:to-brand-blue/10 transition-all duration-200"
        >
          <User className="w-4 h-4 text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground">Motorpresse</h4>
          <Badge 
            variant="secondary" 
            className="text-xs border border-brand-purple/20 bg-brand-purple/5 text-brand-purple hover:bg-brand-purple/10"
          >
            Test Account
          </Badge>
        </div>
      </PopoverContent>
    </Popover>
  );
}