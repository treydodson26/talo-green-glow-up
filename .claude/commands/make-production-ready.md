---
name: make-production-ready
description: Analyze Lovable.dev project and implement production-ready improvements
---

# Make Lovable.dev Project Production Ready

## Phase 1: Initial Analysis and Assessment

First, analyze the current project structure and identify all areas that need production hardening:

1. **Security Audit**
   - Review all Supabase RLS policies and fix the security issues mentioned in the document
   - Check for exposed API keys or credentials in the codebase
   - Review authentication flows and session management
   - Audit all edge functions for security vulnerabilities
   - Check for SQL injection vulnerabilities in database queries

2. **Performance Analysis**
   - Identify and fix the unindexed foreign keys mentioned
   - Remove unused indexes (5 identified in the document)
   - Optimize RLS policies that re-evaluate auth functions
   - Analyze bundle size and implement code splitting
   - Check for memory leaks in React components

3. **Code Quality Review**
   - Check for any console.logs or debug statements
   - Review error handling across all components
   - Ensure proper TypeScript types (no 'any' types)
   - Check for unused imports and dead code

## Phase 2: Security Hardening

Implement these security improvements:

```typescript
// 1. Fix Security Definer Views
// Review and update these views:
// - intro_offer_customers
// - customers_by_stage  
// - dashboard_metrics

// 2. Update RLS Policies
// Wrap auth functions in SELECT statements for better performance
// Example transformation:
// FROM: auth.uid() = user_id
// TO: (SELECT auth.uid()) = user_id

// 3. Environment Variables
// Move all sensitive data to environment variables
// Create .env.production file with proper values

// 4. Update Supabase Auth Settings
// - Reduce OTP expiry to < 1 hour
// - Enable leaked password protection
// - Move pg_net extension out of public schema
```

## Phase 3: Performance Optimization

1. **Database Optimizations**
   ```sql
   -- Add missing index
   CREATE INDEX idx_communications_log_message_sequence_id 
   ON communications_log(message_sequence_id);
   
   -- Remove unused indexes
   DROP INDEX IF EXISTS idx_communications_log_status;
   DROP INDEX IF EXISTS idx_communications_log_whatsapp_id;
   DROP INDEX IF EXISTS idx_csv_imports_filename;
   DROP INDEX IF EXISTS idx_csv_imports_status;
   DROP INDEX IF EXISTS idx_csv_imports_started_at;
   ```

2. **Frontend Optimizations**
   - Implement React.lazy() for route-based code splitting
   - Add loading states and error boundaries
   - Optimize images with next-gen formats
   - Implement virtual scrolling for large lists
   - Add service worker for offline capability

## Phase 4: Error Handling and Monitoring

1. **Global Error Handling**
   ```typescript
   // Add error boundary component
   // Implement global error logging
   // Set up Sentry or similar error tracking
   ```

2. **API Error Handling**
   - Standardize error responses
   - Add retry logic with exponential backoff
   - Implement request timeout handling

3. **User Feedback**
   - Add toast notifications for all actions
   - Implement proper loading states
   - Add confirmation dialogs for destructive actions

## Phase 5: Testing Implementation

1. **Unit Tests**
   - Add tests for all utility functions
   - Test React components with React Testing Library
   - Test Supabase edge functions

2. **Integration Tests**
   - Test critical user flows
   - Test API integrations (WhatsApp, Email, N8N)
   - Test database operations

3. **E2E Tests**
   - Implement Playwright tests for critical paths
   - Test intro offer lifecycle
   - Test marketing hub workflows

## Phase 6: CI/CD Pipeline

1. **GitHub Actions Setup**
   ```yaml
   name: Production Deployment
   on:
     push:
       branches: [main]
   
   jobs:
     test:
       # Run all tests
     
     build:
       # Build production bundle
       
     deploy:
       # Deploy to production
   ```

2. **Pre-deployment Checks**
   - Run linting and type checking
   - Run all tests
   - Check bundle size limits
   - Validate environment variables

## Phase 7: Production Configuration

1. **Environment Setup**
   - Set NODE_ENV=production
   - Configure proper CORS policies
   - Set up CDN for static assets
   - Configure rate limiting

2. **Monitoring Setup**
   - Add application monitoring (APM)
   - Set up uptime monitoring
   - Configure database monitoring
   - Add custom business metrics

3. **Backup Strategy**
   - Implement automated database backups
   - Set up backup retention policies
   - Test backup restoration process

## Phase 8: Documentation Updates

1. **Technical Documentation**
   - API documentation
   - Database schema documentation
   - Deployment procedures
   - Troubleshooting guide

2. **User Documentation**
   - User manual for staff
   - Admin guide
   - FAQ section

## Phase 9: Final Production Checklist

- [ ] All security vulnerabilities fixed
- [ ] Database optimized with proper indexes
- [ ] Error handling implemented throughout
- [ ] Tests passing with >80% coverage
- [ ] CI/CD pipeline configured
- [ ] Monitoring and alerting set up
- [ ] Backups configured and tested
- [ ] Documentation complete
- [ ] Load testing completed
- [ ] SSL certificates configured
- [ ] Domain and DNS properly set up
- [ ] Legal compliance verified (GDPR, etc.)

## Execution Order

1. Start with security fixes (highest priority)
2. Implement performance optimizations
3. Add comprehensive error handling
4. Set up testing framework
5. Configure CI/CD pipeline
6. Deploy to staging environment
7. Perform thorough testing
8. Deploy to production
9. Monitor for 24-48 hours
10. Document any issues and fixes

## Notes

- Each phase should be committed separately for easy rollback
- Test thoroughly after each major change
- Keep the Lovable.dev sync active during development
- Use feature flags for gradual rollout of major changes

Remember to coordinate with the team and communicate any breaking changes or downtime requirements. 