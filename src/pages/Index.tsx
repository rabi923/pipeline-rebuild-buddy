import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Heart, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6 shadow-[var(--shadow-card)]">
          <Leaf className="h-12 w-12 text-white" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          FoodShare
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
          Connecting food givers with receivers to reduce waste and fight hunger
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl mb-12">
          <div className="p-6 rounded-2xl border-2 bg-card/50 backdrop-blur-sm shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-all">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Leaf className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Food Givers</h3>
            <p className="text-muted-foreground mb-4">
              Share your excess food and help reduce waste
            </p>
            <ul className="text-sm text-left space-y-2 text-muted-foreground">
              <li>• List food with photos</li>
              <li>• Set pickup times</li>
              <li>• Connect with receivers</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border-2 bg-card/50 backdrop-blur-sm shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-soft)] transition-all">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Food Receivers</h3>
            <p className="text-muted-foreground mb-4">
              Find and collect available food near you
            </p>
            <ul className="text-sm text-left space-y-2 text-muted-foreground">
              <li>• Browse nearby food</li>
              <li>• Search & filter</li>
              <li>• Contact givers easily</li>
            </ul>
          </div>
        </div>

        <Button
          size="lg"
          className="h-14 px-8 text-lg font-medium shadow-lg"
          onClick={() => navigate('/auth')}
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <p className="mt-6 text-sm text-muted-foreground">
          Join our community in reducing food waste
        </p>
      </div>
    </div>
  );
};

export default Index;
