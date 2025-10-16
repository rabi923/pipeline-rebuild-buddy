import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import RequestCard from './RequestCard';
import AddRequestDialog from './AddRequestDialog';

interface MyRequestsProps {
  onBack: () => void;
}

const MyRequests = ({ onBack }: MyRequestsProps) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from('food_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching requests:', error);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center gap-4 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex-1">My Requests</h1>
        <Button onClick={() => setShowAddDialog(true)} size="icon">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <p className="text-muted-foreground mb-4">
            No requests yet. Create your first food request!
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Button>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4 pb-24">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isOwner={true}
                onUpdate={fetchRequests}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      <AddRequestDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={fetchRequests}
      />
    </div>
  );
};

export default MyRequests;
