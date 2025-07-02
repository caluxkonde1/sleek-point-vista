import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PricingPlan = ({ 
  name, 
  price, 
  period = "day", 
  features, 
  buttonVariant, 
  isPopular = false,
  color 
}: {
  name: string;
  price: string;
  period?: string;
  features: string[];
  buttonVariant: string;
  isPopular?: boolean;
  color: 'green' | 'blue' | 'orange';
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return {
          border: 'border-pos-green/20',
          accent: 'text-pos-green',
          button: 'pos-button-green'
        };
      case 'blue':
        return {
          border: 'border-pos-blue/20',
          accent: 'text-pos-blue',
          button: 'pos-button-blue'
        };
      case 'orange':
        return {
          border: 'border-pos-orange/20',
          accent: 'text-pos-orange',
          button: 'pos-button-orange'
        };
    }
  };

  const colorClasses = getColorClasses();

  return (
    <Card className={`relative ${colorClasses.border} ${isPopular ? 'ring-2 ring-pos-blue scale-105' : ''}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-pos-blue text-pos-blue-foreground text-sm font-medium px-4 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" />
            Most Popular
          </span>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className={`text-xl font-semibold ${colorClasses.accent}`}>
          {name}
        </CardTitle>
        <CardDescription className="text-3xl font-bold text-foreground mt-2">
          {price}
          <span className="text-sm font-normal text-muted-foreground">/{period}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className={`w-5 h-5 ${colorClasses.accent} mt-0.5 flex-shrink-0`} />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button className={`w-full ${colorClasses.button} font-medium`}>
          Subscribe Now
        </Button>
      </CardContent>
    </Card>
  );
};

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "Rp0",
      features: [
        "Basic POS system",
        "Up to 1 outlet",
        "Maximum 10 products",
        "Basic sales report (30 days)",
        "Email support",
        "Mobile app access"
      ],
      buttonVariant: "pos-button-green",
      color: 'green' as const
    },
    {
      name: "Pro",
      price: "Rp1.577",
      features: [
        "Everything in Free",
        "Unlimited employees",
        "Sales trends & filtering",
        "Product export features",
        "Discount & tax per product",
        "Multiple outlets (additional charge)",
        "Priority support",
        "Advanced analytics"
      ],
      buttonVariant: "pos-button-blue",
      color: 'blue' as const,
      isPopular: true
    },
    {
      name: "Pro Plus",
      price: "Rp3.450",
      features: [
        "Everything in Pro",
        "Employee attendance system",
        "Kitchen ticket printing",
        "Bundling & bulk pricing",
        "Inventory expiry alerts",
        "Custom branding on receipts",
        "API access",
        "24/7 phone support",
        "Custom integrations"
      ],
      buttonVariant: "pos-button-orange",
      color: 'orange' as const
    }
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Scale your business with our flexible POS solutions. From startups to enterprises, 
            we have the right plan for your needs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingPlan
              key={index}
              name={plan.name}
              price={plan.price}
              features={plan.features}
              buttonVariant={plan.buttonVariant}
              color={plan.color}
              isPopular={plan.isPopular}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Need a custom solution? We're here to help.
          </p>
          <Button variant="outline" size="lg">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;