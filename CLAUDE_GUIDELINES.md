# Claude Code Guidelines for Talo Fitness Studio Management

## Implementation Best Practices

### 0 — Purpose  

These rules ensure maintainability, safety, and developer velocity for the Talo fitness studio management application.
**MUST** rules are enforced by CI; **SHOULD** rules are strongly recommended.

---

### 1 — Before Coding

- **BP-1 (MUST)** Ask the user clarifying questions about fitness studio business logic.
- **BP-2 (SHOULD)** Draft and confirm an approach for complex features (scheduling, customer management, communication).  
- **BP-3 (SHOULD)** If ≥ 2 approaches exist, list clear pros and cons considering mobile usage and staff efficiency.

---

### 2 — While Coding

- **C-1 (MUST)** Follow TDD: scaffold stub -> write failing test -> implement.
- **C-2 (MUST)** Use fitness domain vocabulary consistently (classes, instructors, customers, intro_offers, etc.).  
- **C-3 (SHOULD NOT)** Introduce classes when small testable functions suffice.  
- **C-4 (SHOULD)** Prefer simple, composable, testable functions.
- **C-5 (MUST)** Prefer branded `type`s for IDs from Supabase
  ```ts
  type CustomerId = Brand<string, 'CustomerId'>   // ✅ Good
  type CustomerId = string                        // ❌ Bad
  ```  
- **C-6 (MUST)** Use `import type { … }` for type-only imports.
- **C-7 (SHOULD NOT)** Add comments except for critical business logic caveats; rely on self‑explanatory code.
- **C-8 (SHOULD)** Default to `type`; use `interface` only when more readable or interface merging is required. 
- **C-9 (SHOULD NOT)** Extract a new function unless it will be reused elsewhere, is the only way to unit-test otherwise untestable logic, or drastically improves readability.
- **C-10 (MUST)** Use generated Supabase types from `src/integrations/supabase/types.ts`.
- **C-11 (MUST)** Follow shadcn/ui component patterns for UI consistency.

---

### 3 — Testing

- **T-1 (MUST)** For a simple function, colocate unit tests in `*.test.ts` or `*.spec.ts` in same directory as source file.
- **T-2 (MUST)** For any Supabase integration, add integration tests that verify database interactions.
- **T-3 (MUST)** ALWAYS separate pure-logic unit tests from Supabase-touching integration tests.
- **T-4 (SHOULD)** Prefer integration tests over heavy mocking for database operations.  
- **T-5 (SHOULD)** Unit-test complex business logic thoroughly (capacity management, instructor substitutions).
- **T-6 (SHOULD)** Test the entire structure in one assertion if possible
  ```ts
  expect(result).toEqual([expectedValue]) // Good

  expect(result).toHaveLength(1);         // Bad
  expect(result[0]).toBe(expectedValue);  // Bad
  ```
- **T-7 (MUST)** Test fitness studio edge cases: class capacity limits, scheduling conflicts, customer lifecycle states.

---

### 4 — Database & Supabase

- **D-1 (MUST)** Use Supabase client from `src/integrations/supabase/client.ts` consistently.  
- **D-2 (MUST)** Type all database operations with generated types from `src/integrations/supabase/types.ts`.
- **D-3 (SHOULD)** Handle real-time subscriptions appropriately for live updates (class schedules, capacity changes).
- **D-4 (MUST)** Respect Row Level Security (RLS) policies when implementing new features.
- **D-5 (SHOULD)** Use TanStack Query for all server state management with proper error handling.

---

### 5 — React Components & UI

- **R-1 (MUST)** Use shadcn/ui components as building blocks from `src/components/ui/`.
- **R-2 (MUST)** Follow existing component patterns (props interfaces as `ComponentNameProps`).
- **R-3 (MUST)** Use Tailwind CSS with semantic tokens (`text-destructive`, `bg-primary`, etc.).
- **R-4 (SHOULD)** Use `cn()` utility from `src/lib/utils.ts` for conditional classes.
- **R-5 (MUST)** Implement responsive design with mobile-first approach for staff tablet/phone usage.
- **R-6 (SHOULD)** Use React Hook Form with Zod validation for forms.
- **R-7 (MUST)** Handle loading and error states consistently across components.

---

### 6 — Business Logic

- **B-1 (MUST)** Understand fitness studio workflows: customer lifecycle, class capacity, instructor management.
- **B-2 (MUST)** Prevent overbooking by respecting class capacity limits.
- **B-3 (SHOULD)** Prioritize staff efficiency in UI/UX decisions.
- **B-4 (MUST)** Handle instructor substitutions as critical operations.
- **B-5 (SHOULD)** Consider customer conversion pipeline (intro offers → members) in feature design.

---

### 7 — Code Organization

- **O-1 (MUST)** Place reusable UI components in `src/components/ui/`.
- **O-2 (MUST)** Place business components in `src/components/`.
- **O-3 (MUST)** Use `@/` path alias for imports from `src/`.
- **O-4 (SHOULD)** Group related functionality (dashboard, inbox, operations) in logical modules.

---

### 8 — Tooling Gates

- **G-1 (MUST)** `npm run lint` passes.  
- **G-2 (MUST)** `npm run typecheck` passes.
- **G-3 (SHOULD)** `npm test` passes with coverage ≥ 80%.
- **G-4 (SHOULD)** Run `npm run build` to verify production build works.

---

### 9 - Git

- **GH-1 (MUST)** Use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0
- **GH-2 (SHOULD NOT)** Refer to Claude or Anthropic in commit messages.
- **GH-3 (SHOULD)** Structure commit messages as:
  ```
  <type>[optional scope]: <description>
  [optional body]
  [optional footer(s)]
  ```

---

## Writing Functions Best Practices

When evaluating whether a function you implemented is good or not, use this checklist:

1. Can you read the function and HONESTLY easily follow what it's doing? If yes, then stop here.
2. Does the function have very high cyclomatic complexity? If it does, then it's probably sketchy.
3. Are there any common data structures and algorithms that would make this function much easier to follow and more robust?
4. Are there any unused parameters in the function?
5. Are there any unnecessary type casts that can be moved to function arguments?
6. Is the function easily testable without mocking Supabase queries? If not, can this function be tested as part of an integration test?
7. Does it have any hidden untested dependencies or any values that can be factored out into the arguments instead?
8. Brainstorm 3 better function names using fitness domain vocabulary and see if the current name is the best.

IMPORTANT: you SHOULD NOT refactor out a separate function unless there is a compelling need, such as:
  - the refactored function is used in more than one place
  - the refactored function is easily unit testable while the original function is not AND you can't test it any other way
  - the original function is extremely hard to follow and you resort to putting comments everywhere just to explain it

## Writing Tests Best Practices

When evaluating whether a test you've implemented is good or not, use this checklist:

1. SHOULD parameterize inputs; never embed unexplained literals directly in the test.
2. SHOULD NOT add a test unless it can fail for a real defect.
3. SHOULD ensure the test description states exactly what the final expect verifies.
4. SHOULD compare results to independent, pre-computed expectations or domain properties.
5. SHOULD follow the same lint, type-safety, and style rules as prod code.
6. SHOULD express fitness domain invariants (e.g., capacity constraints, scheduling conflicts).
7. Unit tests for a function should be grouped under `describe(functionName, () => ...`.
8. Use `expect.any(...)` when testing for parameters that can be anything (e.g. Supabase UUIDs).
9. ALWAYS use strong assertions over weaker ones.
10. SHOULD test edge cases, realistic fitness studio scenarios, and boundary conditions.
11. SHOULD NOT test conditions that are caught by the TypeScript compiler.

## Code Organization

- `src/components/` - Business components (dashboard, clients, operations)
  - `src/components/ui/` - Reusable shadcn/ui components
- `src/integrations/supabase/` - Database client and generated types
- `src/lib/` - Utilities and shared logic
- `src/pages/` - Route components
- `src/hooks/` - Custom React hooks
- `supabase/` - Database migrations and Edge Functions

## Domain-Specific Testing

For fitness studio features, always test:
- **Class capacity management**: Overbooking prevention, waitlist handling
- **Instructor substitutions**: Critical path for daily operations
- **Customer lifecycle**: Intro offer states, conversion tracking
- **Communication flows**: Message templates, WhatsApp integration
- **Real-time updates**: Class schedules, capacity changes

## Remember Shortcuts

### QNEW
When I type "qnew", this means:
```
Understand all BEST PRACTICES listed in CLAUDE_GUIDELINES.md.
Your code SHOULD ALWAYS follow these best practices for the Talo fitness studio management application.
```

### QPLAN
When I type "qplan", this means:
```
Analyze similar parts of the Talo codebase and determine whether your plan:
- is consistent with existing fitness domain patterns
- introduces minimal changes to the React/Supabase architecture
- reuses existing shadcn/ui components and Tailwind patterns
- considers mobile usage and staff efficiency
```

### QCODE
When I type "qcode", this means:
```
Implement your plan for the Talo fitness studio app and make sure your new tests pass.
Always run tests to make sure you didn't break anything else.
Always run `npm run typecheck` and `npm run lint` to ensure code quality.
Test your changes considering fitness studio workflows and staff usage patterns.
```

### QCHECK
When I type "qcheck", this means:
```
You are a SKEPTICAL senior software engineer working on fitness studio management software.
Perform this analysis for every MAJOR code change you introduced (skip minor changes):

1. CLAUDE_GUIDELINES.md checklist Writing Functions Best Practices.
2. CLAUDE_GUIDELINES.md checklist Writing Tests Best Practices.
3. CLAUDE_GUIDELINES.md checklist Implementation Best Practices.
4. Does this change improve staff efficiency and mobile usability?
5. Does this change respect fitness studio business constraints?
```

### QCHECKF
When I type "qcheckf", this means:
```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR function you added or edited (skip minor changes):

1. CLAUDE_GUIDELINES.md checklist Writing Functions Best Practices.
2. Does this function use proper fitness domain vocabulary?
3. Does this function handle Supabase operations correctly?
```

### QCHECKT
When I type "qcheckt", this means:
```
You are a SKEPTICAL senior software engineer.
Perform this analysis for every MAJOR test you added or edited (skip minor changes):

1. CLAUDE_GUIDELINES.md checklist Writing Tests Best Practices.
2. Does this test cover fitness studio edge cases?
3. Does this test properly mock/integrate with Supabase?
```

### QUX
When I type "qux", this means:
```
Imagine you are a fitness studio staff member testing the feature you implemented on a tablet.
Output a comprehensive list of scenarios you would test, sorted by highest priority for daily studio operations.
Consider: class scheduling, customer management, instructor coordination, mobile usage.
```

### QGIT
When I type "qgit", this means:
```
Add all changes to staging, create a commit, and push to remote.

Follow this checklist for writing your commit message:
- SHOULD use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0
- SHOULD NOT refer to Claude or Anthropic in the commit message.
- SHOULD use fitness domain context in commit descriptions
- SHOULD structure commit message as:
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]

Common types for Talo:
- feat: new fitness studio feature
- fix: bug fix for studio operations
- refactor: code improvement without feature changes
- test: adding or updating tests
- docs: documentation updates
- style: formatting, UI improvements
- perf: performance improvements for staff efficiency
```