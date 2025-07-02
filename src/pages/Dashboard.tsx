import { ShoppingCart, DollarSign, TrendingUp, XCircle } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import { HourlySalesChart, LocationSalesChart } from "@/components/dashboard/SalesChart";

const Dashboard = () => {
  const metrics = [
    {
      title: "Total orders",
      value: "342",
      change: "4.2%",
      changeType: "positive" as const,
      period: "last month",
      icon: <ShoppingCart className="w-4 h-4 text-pos-blue" />
    },
    {
      title: "Total sales",
      value: "$1,290",
      change: "2.2%",
      changeType: "positive" as const,
      period: "from last month",
      icon: <DollarSign className="w-4 h-4 text-pos-green" />
    },
    {
      title: "Net sales",
      value: "$1,940",
      change: "4.0%",
      changeType: "positive" as const,
      period: "from last month",
      icon: <TrendingUp className="w-4 h-4 text-pos-blue" />
    },
    {
      title: "Cancelled orders",
      value: "12",
      change: "1.5%",
      changeType: "negative" as const,
      period: "from last month",
      icon: <XCircle className="w-4 h-4 text-destructive" />
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <DashboardHeader />
        
        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <MetricCard
                  key={index}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  changeType={metric.changeType}
                  period={metric.period}
                  icon={metric.icon}
                />
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HourlySalesChart />
              <LocationSalesChart />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;