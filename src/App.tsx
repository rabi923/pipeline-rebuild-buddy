// App.tsx

import { Suspense, lazy } from "react"; // Step 1: Add imports
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Step 2: Change static imports to dynamic lazy imports
import Index from "./pages/Index";
import Auth from "./pages/Auth";
// import GiverDashboard from "./pages/GiverDashboard"; <-- Remove these
// import ReceiverDashboard from "./pages/ReceiverDashboard"; <-- Remove these
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const GiverDashboard = lazy(() => import("./pages/GiverDashboard"));
const ReceiverDashboard = lazy(() => import("./pages/ReceiverDashboard"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {/* Step 3: Wrap your routes in a Suspense component */}
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading page...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/giver-dashboard" element={<GiverDashboard />} />
            <Route path="/receiver-dashboard" element={<ReceiverDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
