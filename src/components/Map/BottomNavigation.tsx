import { Home, Plus, MessageCircle, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole?: 'food_giver' | 'food_receiver';
}

const BottomNavigation = ({ currentTab, onTabChange, userRole }: BottomNavigationProps) => {
  const handleClick = (tab: string) => {
    onTabChange(tab);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around shadow-lg z-50">
      <button
        onClick={() => handleClick('map')}
        className={cn(
          "flex flex-col items-center justify-center min-w-[60px] h-full transition-colors",
          currentTab === 'map' ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Home className="h-6 w-6" />
        <span className="text-xs mt-1">Map</span>
      </button>
      
      {userRole === 'food_giver' && (
        <button
          onClick={() => handleClick('listings')}
          className={cn(
            "flex flex-col items-center justify-center min-w-[60px] h-full transition-colors",
            currentTab === 'listings' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <List className="h-6 w-6" />
          <span className="text-xs mt-1">My Food</span>
        </button>
      )}

      {userRole === 'food_receiver' && (
        <button
          onClick={() => handleClick('requests')}
          className={cn(
            "flex flex-col items-center justify-center min-w-[60px] h-full transition-colors",
            currentTab === 'requests' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <List className="h-6 w-6" />
          <span className="text-xs mt-1">My Requests</span>
        </button>
      )}
      
      <button
        onClick={() => handleClick('add')}
        className="flex flex-col items-center justify-center transform -translate-y-4"
      >
        <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-6 w-6" />
        </div>
        <span className="text-xs mt-1 text-muted-foreground">
          {userRole === 'food_giver' ? 'Add' : 'Request'}
        </span>
      </button>
      
      <button
        onClick={() => handleClick('chat')}
        className={cn(
          "flex flex-col items-center justify-center min-w-[60px] h-full transition-colors",
          currentTab === 'chat' ? "text-primary" : "text-muted-foreground"
        )}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="text-xs mt-1">Chat</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
