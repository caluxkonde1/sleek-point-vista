import { 
  BarChart3, 
  FileText, 
  Package, 
  Users, 
  Building, 
  Archive,
  Wallet,
  Menu
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const sidebarItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: BarChart3,
    path: "/dashboard",
  },
  {
    id: "laporan",
    label: "Laporan",
    icon: FileText,
    path: "/dashboard/laporan"
  },
  {
    id: "produk",
    label: "Produk",
    icon: Package,
    path: "/dashboard/produk"
  },
  {
    id: "pegawai",
    label: "Pegawai",
    icon: Users,
    path: "/dashboard/pegawai"
  },
  {
    id: "outlet",
    label: "Outlet", 
    icon: Building,
    path: "/dashboard/outlet"
  },
  {
    id: "inventaris",
    label: "Inventaris",
    icon: Archive,
    path: "/dashboard/inventaris"
  },
  {
    id: "kelola-kas",
    label: "Kelola Kas",
    icon: Wallet,
    path: "/dashboard/kelola-kas"
  }
];

const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile } = useAuth();

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-sidebar border-r transition-all duration-300 flex flex-col`}>
      {/* Header with toggle */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold">POS Tenet</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                    }`
                  }
                  end={item.path === "/dashboard"}
                  title={isCollapsed ? item.label : undefined}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs text-primary-foreground font-medium">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {profile?.role || 'staff'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSidebar;