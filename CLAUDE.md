# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Talo** is a comprehensive fitness studio management web application built with React, TypeScript, and Supabase. It provides CRM, class scheduling, instructor management, communication tools, and marketing features specifically designed for fitness studio operations.

**Tech Stack**: React 18.3 + TypeScript + Vite + Supabase + shadcn/ui + Tailwind CSS + TanStack Query

## Development Commands

```bash
# Development
npm run dev          # Start dev server on localhost:8080
npm run build        # Production build  
npm run build:dev    # Development build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Alternative package manager (also supported)
bun install          # Install dependencies with Bun
bun run dev          # Run with Bun
```

## Architecture Overview

### Database & Backend
- **Supabase PostgreSQL** with real-time subscriptions
- **Row Level Security (RLS)** for data access control
- **Edge Functions** in `supabase/functions/` for integrations (WhatsApp, Gmail, n8n)
- **Database types** auto-generated in `src/integrations/supabase/types.ts`

### Key Database Tables
- `classes_schedule` - Class scheduling with capacity management
- `customers` - Customer/member management
- `intro_offers` - Customer conversion pipeline
- `inbox_messages` - Communication history
- `instructors` - Staff management

### Frontend Architecture
- **Component Structure**: Business components in `src/components/`, reusable UI in `src/components/ui/`
- **Routing**: React Router with protected routes via Supabase Auth
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Styling**: Tailwind CSS with custom design tokens in `tailwind.config.ts`
- **Path Aliases**: `@/` resolves to `src/`

### Core Business Components

**Dashboard Hub (`src/pages/Index.tsx`)**:
- `MetricsCards` - KPI display (revenue, member counts, etc.)
- `TodaysClasses` - Daily schedule with capacity indicators  
- `UrgentActions` - Priority items (substitute needs, expired offers)
- `QuickActions` - Common staff tasks (add customer, send message, etc.)
- `IntroOffersPipeline` - Customer conversion tracking

**Communication System**:
- `InboxPage` - Centralized message management
- `MessageModal` - Message composition with templates
- `CommunicationCenter` - Message analytics and history
- WhatsApp integration via Edge Functions

**Operations Management**:
- `ClientsTable` - Customer database with filtering/search
- `AddCustomerDialog` - Customer onboarding forms
- `InstructorHub` - Staff scheduling and management
- `OperationsHub` - Daily operations overview

## Development Patterns

### Component Development
- Use `shadcn/ui` components as building blocks
- Follow the existing component patterns in `src/components/ui/`
- Props interfaces follow `ComponentNameProps` convention
- Use TypeScript strictly - all components are fully typed

### Data Fetching
- Use TanStack Query hooks for all server state
- Supabase client configured for real-time subscriptions
- Database operations use generated TypeScript types

### Styling Conventions
- Tailwind CSS with semantic color tokens (`text-destructive`, `bg-primary`, etc.)
- Custom CSS properties defined in `src/styles.css`
- Responsive design with mobile-first approach
- Use `cn()` utility for conditional classes

### Form Handling
- React Hook Form with Zod validation
- Form components in `src/components/ui/form.tsx`
- Consistent error handling and loading states

## Business Context

This is fitness studio management software, so consider these domain-specific needs:
- **Class capacity management** - prevent overbooking, manage waitlists
- **Instructor substitutions** - critical for daily operations
- **Customer lifecycle** - intro offers → member conversion is key revenue driver  
- **Staff efficiency** - features should speed up common tasks
- **Mobile usage** - staff often use tablets/phones

## External Integrations

- **WhatsApp Business API** - customer messaging
- **Gmail integration** - email campaigns and responses  
- **n8n workflows** - automation platform
- **Flyer generation** - marketing materials

## Supabase Configuration

- Local development config in `supabase/config.toml`
- Edge Functions for external API integrations
- Real-time subscriptions for live updates
- Authentication handled via Supabase Auth

## Code Quality

- ESLint configured with React/TypeScript rules
- Strict TypeScript configuration
- Component props fully typed with generated Supabase types
- Lovable platform integration with component tagging in development

## Common Development Tasks

When working on this codebase:
1. **Component changes**: Reference the component name specifically (e.g., "In the TodaysClasses component...")
2. **Database operations**: Use the generated types from `src/integrations/supabase/types.ts`
3. **Styling**: Use Tailwind classes and semantic tokens
4. **Business logic**: Consider fitness studio workflows and staff efficiency
5. **Testing changes**: Use `npm run lint` to verify code quality

## Important Files

- `src/integrations/supabase/` - Database client and types
- `src/components/ui/` - Reusable UI components (shadcn/ui)
- `supabase/migrations/` - Database schema changes
- `PROMPTING_GUIDE.md` - Detailed guidance for making changes to this application