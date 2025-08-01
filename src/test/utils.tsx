// Test utilities for consistent test setup
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const createMockCustomer = (overrides = {}) => ({
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone_number: '+1234567890',
  status: 'intro_trial' as const,
  intro_start_date: '2024-01-01',
  intro_end_date: '2024-01-31',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCommunication = (overrides = {}) => ({
  id: 1,
  customer_id: 1,
  message_type: 'email' as const,
  subject: 'Test Subject',
  content: 'Test content',
  delivery_status: 'sent' as const,
  sent_at: '2024-01-01T10:00:00Z',
  created_at: '2024-01-01T10:00:00Z',
  ...overrides,
});

export const createMockClass = (overrides = {}) => ({
  id: 1,
  class_name: 'Morning Vinyasa',
  instructor_name: 'Emily',
  class_date: new Date().toISOString().split('T')[0],
  start_time: '09:00:00',
  end_time: '10:30:00',
  capacity: 12,
  current_bookings: 8,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Test helpers
export const waitForLoadingToFinish = () => 
  new Promise((resolve) => setTimeout(resolve, 0));

export const mockConsoleError = () => {
  const originalError = console.error;
  console.error = (() => {}) as any;
  return () => {
    console.error = originalError;
  };
};

export const mockConsoleWarn = () => {
  const originalWarn = console.warn;
  console.warn = (() => {}) as any;
  return () => {
    console.warn = originalWarn;
  };
};