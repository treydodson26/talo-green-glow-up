
# Lovable Prompting Guide: Best Practices for Better Results

## 🎯 The Golden Formula

**Component/Location + Specific Goal + Detailed Requirements + Context**

```
[WHERE] + [WHAT] + [HOW] + [WHY/CONTEXT]
```

---

## ❌ Common Prompting Mistakes vs ✅ Better Approaches

### 1. Vague vs Specific Locations

❌ **Avoid:** "Change the colors"
✅ **Better:** "In the InboxPage component, change the email badge colors from blue to green"

❌ **Avoid:** "Make it look better" 
✅ **Better:** "In the TodaysClasses card on the dashboard, increase the spacing between class items and make the instructor names more prominent"

### 2. Unclear Goals vs Clear Objectives

❌ **Avoid:** "Fix the design"
✅ **Better:** "Improve the visual hierarchy in the UrgentActions component by making high-priority items more prominent and adding better spacing"

❌ **Avoid:** "Update the layout"
✅ **Better:** "Convert the QuickActions grid from 5 columns to 3 columns on desktop and stack vertically on mobile"

### 3. Missing Context vs Rich Context

❌ **Avoid:** "Add a button"
✅ **Better:** "Add a 'Schedule Makeup Class' button to each expired intro offer card in the IntroOffersPipeline component, since customers often need to reschedule their sessions"

---

## 📋 Component-Specific Prompting Templates

### Dashboard Components
```
Template: "In the [MetricsCards/TodaysClasses/UrgentActions] component, [specific change] to [achieve goal] because [context about fitness studio needs]"

Example: "In the TodaysClasses component, add a red warning indicator next to classes that are at 100% capacity to help staff quickly identify fully booked sessions"
```

### Communication Features
```
Template: "In the [InboxPage/MessageModal] component, [modify specific element] to [improve workflow] for [staff role]"

Example: "In the InboxPage component, add filter buttons for 'Unread', 'Failed Deliveries', and 'Needs Response' to help front desk staff prioritize customer communications"
```

### Customer Management
```
Template: "In the [ClientsTable/AddCustomerDialog] component, [enhance specific field/section] to [capture important data] for [business process]"

Example: "In the AddCustomerDialog component, add an 'Emergency Contact' section with phone and relationship fields since fitness studios need this information for safety"
```

---

## 🎨 Design-Specific Language

### Colors & Theming
✅ **Use semantic tokens:** "Change to `text-destructive` for error states"
✅ **Be specific:** "Use `bg-green-500` for success indicators"
❌ **Avoid:** "Make it red" or "Change the color"

### Spacing & Layout
✅ **Use Tailwind classes:** "Add `space-y-4` between cards"
✅ **Be precise:** "Increase padding from `p-4` to `p-6`"
❌ **Avoid:** "Add more space" or "Make it bigger"

### Typography
✅ **Specify hierarchy:** "Change from `text-sm` to `text-base` for better readability"
✅ **Include weight:** "Make instructor names `font-semibold`"
❌ **Avoid:** "Make the text bigger"

---

## 🔄 Workflow-Based Prompting

### Before Making Changes
1. **Inspect the component** (use Dev Mode if needed)
2. **Understand the current state**
3. **Identify specific elements to change**

### Batching Related Changes
✅ **Good batching:**
```
"In the TodaysClasses component:
1. Add capacity warning indicators for full classes
2. Highlight classes needing substitutes with red border
3. Add a 'Find Sub' button for urgent coverage needs
4. Show waitlist count as a small badge
This will help studio managers quickly handle scheduling issues."
```

❌ **Poor batching:** Making unrelated requests in one prompt

---

## 📱 Fitness Studio Context Examples

### Customer Lifecycle Prompts
```
"In the IntroOffersPipeline, add an 'Expires Today' section at the top with red urgency styling, since converting intro customers before expiration is critical for revenue"
```

### Operational Efficiency
```
"In the UrgentActions component, prioritize substitute teacher needs above other items and add one-click 'Send Sub Request' functionality for immediate coverage"
```

### Staff Workflow
```
"In the InboxPage, add a 'Quick Reply' section with pre-written responses for common scenarios like 'Class Cancellation', 'Intro Booking', and 'Payment Issues' to speed up customer service"
```

---

## 🚀 Advanced Prompting Techniques

### Multi-Step Requests
When you need complex changes, break them down:

**Step 1:** "First, let's restructure the TodaysClasses component to separate urgent items (needing subs) from regular classes"

**Step 2:** "Now add interactive features like substitute request buttons"

**Step 3:** "Finally, integrate with the communication system for notifications"

### Responsive Design Requests
```
"Make the QuickActions grid responsive:
- Desktop: 5 columns
- Tablet: 3 columns 
- Mobile: 2 columns
- Ensure touch targets are at least 44px on mobile for fitness staff using tablets/phones"
```

### Conditional Logic Requests
```
"In the customer table, show different action buttons based on status:
- Active members: 'Send Message', 'View History'
- Intro customers: 'Schedule Follow-up', 'Convert to Member'  
- Expired intros: 'Re-engagement Campaign', 'Special Offer'"
```

---

## 🎯 Quality Feedback Framework

### When Something Isn't Right

❌ **Avoid:** "This looks bad" or "Change it back"

✅ **Better structured feedback:**
```
"The urgent actions styling needs adjustment:
- The red border is too subtle - make it more prominent
- The priority badges need better color contrast
- The action buttons should be more visually prominent
Goal: Help staff immediately spot critical items that need attention"
```

### Iterative Improvements
```
"The TodaysClasses layout is good, but let's refine:
- Increase spacing between morning and evening classes
- Make the room names more prominent for quick scanning
- Add visual separation for different class types (yoga vs strength)"
```

---

## 📊 Quick Reference: Your App Components

### Dashboard
- `MetricsCards` - Key performance indicators
- `TodaysClasses` - Daily class schedule with capacity
- `UrgentActions` - Priority items needing attention
- `QuickActions` - Common staff tasks
- `IntroOffersPipeline` - Customer conversion tracking

### Communication
- `InboxPage` - Centralized message management
- `MessageModal` - Individual message composition
- `CommunicationCenter` - Message history and analytics

### Operations  
- `ClientsTable` - Customer database management
- `AddCustomerDialog` - New customer onboarding
- `InstructorHub` - Staff scheduling and management

---

## 💡 Pro Tips

1. **Always mention the component name** - helps me locate exactly what to change
2. **Include the business reason** - helps me make better design decisions
3. **Be specific about visual changes** - saves back-and-forth iterations
4. **Think about user workflows** - how will staff actually use this feature?
5. **Consider mobile usage** - fitness staff often use tablets/phones

---

## 🔧 Template for Complex Requests

```
**Component:** [Specific component name]
**Goal:** [What you want to achieve]
**Changes Needed:**
1. [Specific change 1]
2. [Specific change 2] 
3. [Specific change 3]
**Context:** [Why this matters for your fitness studio]
**Expected Outcome:** [How staff will benefit]
```

---

Remember: The more specific and contextual your prompts, the better results you'll get! Think like you're giving instructions to a developer who understands code but needs to understand your fitness studio's unique needs.
