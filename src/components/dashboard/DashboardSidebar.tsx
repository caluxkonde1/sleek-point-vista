import { 
  ShoppingCart, 
  TrendingUp, 
  FileBarChart, 
  ClipboardList, 
  MessageSquare,
  Settings,
  User
} from "lucide-react";
import { NavLink } from "react-router-dom";

const sidebarItems = [
  {
    id: "sales",
    label: "Sales",
    icon: ShoppingCart,
    path: "/dashboard",
    active: true
  },
  {
    id: "marketing",
    label: "Marketing", 
    icon: TrendingUp,
    path: "/dashboard/marketing"
  },
  {
    id: "business",
    label: "Business Summary",
    icon: FileBarChart,
    path: "/dashboard/business"
  },
  {
    id: "reports",
    label: "Reports",
    icon: ClipboardList,
    path: "/dashboard/reports"
  },
  {
    id: "feedback",
    label: "Feedback",
    icon: MessageSquare,
    path: "/dashboard/feedback"
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/dashboard/settings"
  }
];

const DashboardSidebar = () => {
  return (
    <div className="w-64 h-screen bg-sidebar-bg text-sidebar-foreground flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-hover">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">POS Pro</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `sidebar-item ${isActive ? 'active' : ''}`
                  }
                  end={item.path === "/dashboard"}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-hover">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Admin User</p>
            <p className="text-xs text-sidebar-foreground">admin@pos.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;