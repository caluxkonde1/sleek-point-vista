import { Calendar, MapPin, Users, ChevronDown, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const DashboardHeader = () => {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Filters */}
        <div className="flex items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select defaultValue="today">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today • Apr 26, 2018 12:00 AM - Apr 26, 2018 12:00 AM</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country Filter */}
          <Select defaultValue="country">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="country">Select Country</SelectItem>
              <SelectItem value="indonesia">Indonesia</SelectItem>
              <SelectItem value="singapore">Singapore</SelectItem>
              <SelectItem value="malaysia">Malaysia</SelectItem>
            </SelectContent>
          </Select>

          {/* City Filter */}
          <Select defaultValue="city">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="city">Cities</SelectItem>
              <SelectItem value="jakarta">Jakarta</SelectItem>
              <SelectItem value="surabaya">Surabaya</SelectItem>
              <SelectItem value="bandung">Bandung</SelectItem>
            </SelectContent>
          </Select>

          {/* Location Type Filter */}
          <Select defaultValue="location">
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="location">Multi-Location</SelectItem>
              <SelectItem value="single">Single Location</SelectItem>
              <SelectItem value="franchise">Franchise</SelectItem>
            </SelectContent>
          </Select>

          {/* Walk-in Filter */}
          <Select defaultValue="walkin">
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walkin">Walk-in</SelectItem>
              <SelectItem value="dinein">Dine-in</SelectItem>
              <SelectItem value="takeaway">Take Away</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center gap-4">
          {/* Service Type Toggle */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-pos-orange border-pos-orange">
              <Users className="w-3 h-3 mr-1" />
              Walk-in
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              Dine-in
            </Badge>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
          </Button>

          {/* User Profile */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;