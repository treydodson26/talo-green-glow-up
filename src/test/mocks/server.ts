// MSW server for API mocking in tests
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock Supabase API responses
export const handlers = [
  // Mock customers table queries
  rest.get('https://test-project.supabase.co/rest/v1/customers', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '+1234567890',
          status: 'intro_trial',
          intro_start_date: '2024-01-01',
          intro_end_date: '2024-01-31',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone_number: '+1234567891',
          status: 'active_member',
          created_at: '2024-01-01T00:00:00Z',
        },
      ])
    );
  }),

  // Mock customer creation
  rest.post('https://test-project.supabase.co/rest/v1/customers', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json([
        {
          id: 3,
          first_name: 'New',
          last_name: 'Customer',
          email: 'new@example.com',
          phone_number: '+1234567892',
          status: 'prospect',
          created_at: new Date().toISOString(),
        },
      ])
    );
  }),

  // Mock communications_log queries
  rest.get('https://test-project.supabase.co/rest/v1/communications_log', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          customer_id: 1,
          message_type: 'email',
          subject: 'Welcome to Talo Yoga',
          content: 'Welcome message content',
          delivery_status: 'sent',
          sent_at: '2024-01-01T10:00:00Z',
          created_at: '2024-01-01T10:00:00Z',
        },
      ])
    );
  }),

  // Mock message sequences
  rest.get('https://test-project.supabase.co/rest/v1/message_sequences', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          day: 0,
          message_type: 'email',
          subject: 'Welcome to Talo Yoga 🌿',
          content: 'Hi {{first_name}}, welcome to our studio!',
          active: true,
        },
        {
          id: 2,
          day: 7,
          message_type: 'text',
          subject: null,
          content: 'Hi {{first_name}}! How was your first week?',
          active: true,
        },
      ])
    );
  }),

  // Mock classes_schedule
  rest.get('https://test-project.supabase.co/rest/v1/classes_schedule', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          class_name: 'Morning Vinyasa',
          instructor_name: 'Emily',
          class_date: new Date().toISOString().split('T')[0],
          start_time: '09:00:00',
          end_time: '10:30:00',
          capacity: 12,
          current_bookings: 8,
          created_at: '2024-01-01T00:00:00Z',
        },
      ])
    );
  }),

  // Mock dashboard metrics function
  rest.post('https://test-project.supabase.co/rest/v1/rpc/get_dashboard_metrics', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        todays_classes: 3,
        active_intro_offers: 5,
        total_customers: 25,
        pending_communications: 2,
        conversion_rate_monthly: 45.5,
      })
    );
  }),

  // Mock edge functions
  rest.post('https://test-project.supabase.co/functions/v1/send-whatsapp-message', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'WhatsApp message sent successfully',
        whatsapp_message_id: 'mock_message_id',
      })
    );
  }),

  // Mock authentication
  rest.post('https://test-project.supabase.co/auth/v1/token', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        user: {
          id: 'mock_user_id',
          email: 'test@example.com',
          role: 'authenticated',
        },
      })
    );
  }),

  // Catch-all for unhandled requests
  rest.all('*', (req, res, ctx) => {
    console.warn(`Unhandled request: ${req.method} ${req.url}`);
    return res(
      ctx.status(404),
      ctx.json({ message: 'Not found' })
    );
  }),
];

export const server = setupServer(...handlers);