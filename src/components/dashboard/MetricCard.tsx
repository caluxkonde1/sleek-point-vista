import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  period: string;
  icon?: React.ReactNode;
}

const MetricCard = ({ title, value, change, changeType, period, icon }: MetricCardProps) => {
  return (
    <Card className="metric-card hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="metric-label">{title}</h3>
          </div>
          <Button variant="ghost" size="sm" className="text-pos-orange hover:text-pos-orange/80 p-0 h-auto">
            View detail
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <p className="metric-value">{value}</p>
          <div className={`metric-change ${changeType}`}>
            {changeType === 'positive' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{change} from {period}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;