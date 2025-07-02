import { Button } from "@/components/ui/button";
import { ShoppingCart, CreditCard, BarChart3, Users, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Modern Point of Sale
            <span className="block text-transparent bg-gradient-primary bg-clip-text">
              For Your Business
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your business operations with our comprehensive POS platform. 
            From sales tracking to inventory management, we've got you covered.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="pos-button-blue">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Get Started
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                <CreditCard className="w-5 h-5 mr-2" />
                View Pricing
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="lg">
                <BarChart3 className="w-5 h-5 mr-2" />
                Dashboard Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose POS Pro?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-pos-green rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Process transactions in seconds with our optimized POS system
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-pos-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Management</h3>
              <p className="text-muted-foreground">
                Manage employees, track attendance, and control access levels
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-pos-orange rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-muted-foreground">
                Bank-level security with 99.9% uptime guarantee
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of businesses already using POS Pro to streamline their operations
          </p>
          <Link to="/pricing">
            <Button size="lg" className="pos-button-blue">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
