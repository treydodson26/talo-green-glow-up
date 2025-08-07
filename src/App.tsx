import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NewsletterCampaign from "./components/NewsletterCampaign";
import { ClassSchedulePage } from "./components/schedule/ClassSchedulePage";
import { MyBookingsPage } from "./components/schedule/MyBookingsPage";
import AIPlayground from "./pages/AIPlayground";
import BIDashboard from "./pages/BIDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/newsletter-campaign" element={<NewsletterCampaign />} />
          <Route path="/schedule" element={<ClassSchedulePage />} />
          <Route path="/classes" element={<ClassSchedulePage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/ai" element={<AIPlayground />} />
          <Route path="/bi" element={<BIDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
