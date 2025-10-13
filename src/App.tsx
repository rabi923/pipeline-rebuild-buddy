import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const queryClient = new QueryClient();

const TestPage = () => <div>Test Page Works!</div>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="*" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
