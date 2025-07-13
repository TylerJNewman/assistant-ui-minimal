# Implementation Plan: Minimal Chat Interface

## Overview
Transform the current assistant-ui codebase to match the minimal, clean design shown in the image.

## Step-by-Step Implementation Plan

### Phase 1: Layout Simplification
**Commit 1: Remove breadcrumb navigation and simplify layout**
- Remove breadcrumb components from `app/assistant.tsx`
- Remove header section with sidebar trigger and breadcrumb
- Update layout to be more minimal

**Commit 2: Simplify sidebar content**
- Update `components/app-sidebar.tsx` to remove GitHub link and assistant-ui branding
- Keep only essential elements: title, new chat button, search, user info
- Update styling to match the minimal design

### Phase 2: Welcome Screen Updates
**Commit 3: Update welcome message and action buttons**
- Modify `components/assistant-ui/thread.tsx` ThreadWelcome component
- Change heading to "How can I help you, Tyler?"
- Add 4 action buttons: Create, Explore, Code, Learn
- Style buttons to match the design

**Commit 4: Update suggestion prompts**
- Replace current suggestions with the 4 prompts from the image:
  - "How does AI work?"
  - "Are black holes real?"
  - "How many Rs are in the word 'strawberry'?"
  - "What is the meaning of life?"

### Phase 3: Composer Enhancement
**Commit 5: Redesign composer layout**
- Update `components/assistant-ui/thread.tsx` Composer component
- Add model selector dropdown ("Gemini 2.5 Flash")
- Add search and attachment icons
- Redesign send button to be circular and pink
- Update placeholder text to "Type your message here..."

**Commit 6: Style composer to match design**
- Update composer styling for larger, more prominent input
- Add proper spacing and layout for the bottom input area
- Ensure proper alignment of all elements

### Phase 4: API Integration
**Commit 7: Update API endpoint**
- Modify `app/assistant.tsx` to use correct API endpoint
- Update from weather agent to proper chat endpoint
- Ensure proper model configuration

### Phase 5: Final Polish
**Commit 8: Fine-tune styling and spacing**
- Adjust overall layout spacing
- Ensure proper responsive behavior
- Fine-tune color scheme and typography
- Test all interactions

**Commit 9: Add user personalization**
- Update user display name to "Tyler Newman"
- Add proper user avatar/initials
- Ensure user info displays correctly in sidebar

## File Modifications Required

### Primary Files:
1. `app/assistant.tsx` - Main layout and API configuration
2. `components/app-sidebar.tsx` - Sidebar simplification
3. `components/assistant-ui/thread.tsx` - Welcome screen and composer updates
4. `components/assistant-ui/thread-list.tsx` - Thread list styling updates

### Secondary Files:
5. `app/globals.css` - Any additional styling if needed
6. `components/ui/` - Minor component updates if needed

## Success Criteria
- ✅ Clean, minimal layout matching the image
- ✅ Simplified sidebar with essential elements only
- ✅ Updated welcome message and action buttons
- ✅ Redesigned composer with model selector
- ✅ Proper example prompts
- ✅ Responsive design that works on all screen sizes
- ✅ Functional chat interface with proper API integration

## Notes
- Focus on minimal, clean design principles
- Maintain accessibility standards
- Ensure all interactive elements work properly
- Keep existing assistant-ui functionality intact where possible 