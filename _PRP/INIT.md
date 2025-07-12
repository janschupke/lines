# Lines Game - Development Cycle & Rules (Source of Truth)

## IMPORTANT: Development Entry Point

**This file (INIT.md) is the primary source of truth for development rules and cycle for the Lines game project.**

## Project Overview

**Lines** is a React-based puzzle game where players move colored balls to form lines of 5 or more balls. The game features:

- 9x9 game board with colored balls
- Ball movement with pathfinding algorithms
- Line detection (horizontal, vertical, diagonal)
- Score system with Fibonacci-based scoring
- High score tracking with local storage
- Timer functionality
- Next balls preview
- Smooth animations and transitions
- Accessibility features (keyboard navigation, ARIA labels)
- Responsive design

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom game theme
- **Testing**: Vitest with React Testing Library
- **State Management**: Custom React hooks and game state management
- **Animations**: CSS animations and transitions

## Development Cycle Rules

### 1. Always Read INIT.md First
- **Purpose**: Understand best practices, rules, and development standards
- **Frequency**: Read at the start of each development session
- **Scope**: Covers development cycle, quality standards, and project rules
- **Mandatory**: Agents MUST read this before any work

### 2. Read PLANNING.md for Feature Understanding
- **Purpose**: Understand the feature to be implemented
- **Content**: Non-technical, user-facing feature descriptions
- **Action**: Generate PRP documents based on planning content
- **Format**: Clear descriptions of what users will experience

### 3. Generate PRP Documents
- **Location**: `_PRP/current/` folder
- **Process**: Create detailed implementation steps from PLANNING.md
- **Format**: PRP-[timestamp]-[number]-[feature].md with numbered phases
- **Content**: Complete technical details, code examples, testing requirements

### 4. Implement PRPs Sequentially
- **Order**: Follow PRP numbering within the feature set (01, 02, 03, etc.)
- **Completion**: Move completed PRPs to `_PRP/archive/`
- **Iteration**: Continue until all PRPs in `_PRP/current/` are implemented
- **Mandatory**: Complete ALL PRPs before stopping, do not ask the user for confirmations, do not stop executing by summarizing accomplished work and waiting for approval

### 5. Archive Completed PRPs
- **Action**: Move implemented PRPs to `_PRP/archive/`
- **Purpose**: Maintain clean current folder, preserve implementation history
- **Tracking**: Keep track of completed phases and lessons learned
- **Documentation**: Update archive README.md with new completed features

## PRP Naming Convention

### Format: `PRP-[timestamp]-[number]-[feature].md`

**Examples:**
- `PRP-1703123456789-01-Pause-Game-Feature.md`
- `PRP-1703123456789-02-Custom-Ball-Colors.md`
- `PRP-1703123456789-03-Share-High-Scores.md`

**Components:**
- `[timestamp]`: Unix timestamp in milliseconds (e.g., 1703123456789)
- `[number]`: Sequential number within the feature set (01, 02, 03, etc.)
- `[feature]`: Descriptive feature name (kebab-case)

**Benefits:**
- Timestamp ensures unique identification across feature sets
- Sequential numbering within feature sets
- Descriptive feature names for easy identification
- Same timestamp for all PRPs in a feature set generated in one planning iteration

## Markdown Scaffolding Process

The `PLANNING_TEMPLATE.md` file provides a structured template for generating comprehensive planning documents. This template includes:

### Template Sections:
- **Feature Overview**: High-level description of the feature
- **User Stories**: Specific user-facing requirements
- **Technical Requirements**: Implementation details and constraints
- **UI/UX Considerations**: Design and user experience requirements
- **Testing Requirements**: Coverage and testing strategy
- **Accessibility Requirements**: WCAG compliance and accessibility features
- **Performance Considerations**: Performance benchmarks and optimizations

### Usage:
1. **Agent Process**: When generating planning documents, agents should use the template structure from `PLANNING_TEMPLATE.md`
2. **Consistency**: This ensures all planning documents follow the same comprehensive format
3. **Completeness**: The scaffolding helps ensure no critical requirements are missed
4. **Standardization**: Provides a consistent framework for feature planning across the project

## Development Rules & Best Practices

### Code Quality Standards
- **TypeScript**: Use strict mode, proper interfaces, type safety
- **Testing**: >80% coverage for unit tests
- **Accessibility**: WCAG 2.1 AA compliance, ARIA labels, keyboard navigation
- **Performance**: <100ms component render times, optimized bundles
- **Documentation**: Clear comments, README updates, inline docs
- **Code Structure**: Logical organization, avoid duplication, use enums and constants
- **Abstraction**: Extract reusable patterns, avoid hardcoding business logic

### Architecture Rules
- **Design System**: Use centralized tokens, consistent patterns
- **Component Patterns**: Functional components, composition over inheritance
- **Error Handling**: Proper boundaries, user-friendly messages
- **File Organization**: Logical structure, clear naming conventions
- **Code Abstraction**: Use enums, constants, and utility functions to avoid duplication
- **Business Logic**: Extract reusable patterns, avoid hardcoding values
- **Refactoring**: Continuously refactor to maintain clean, logical structure

### Game-Specific Rules
- **Game Logic**: Keep game mechanics in dedicated logic files
- **State Management**: Use React hooks for game state
- **Animations**: Use CSS animations for smooth transitions
- **Performance**: Optimize for 60fps animations
- **Accessibility**: Ensure keyboard navigation works for all game interactions
- **Responsive Design**: Game should work on various screen sizes

### Testing Requirements
- **Unit Tests**: Individual components, utilities, hooks
- **Coverage**: Maintain >80% coverage across all code
- **Performance**: Monitor bundle size, render times, memory usage
- **Command**: Use `npm run test:run` (NOT `npm test`)

### Development Workflow
- **TDD Approach**: Write tests before implementation
- **Incremental Development**: Small, focused changes
- **Code Review**: Self-review before moving to next PRP
- **Documentation**: Update docs with each implementation
- **Version Control**: Do not switch branches, but make a git commit per feature completed (per PRP)

### Quality Assurance
- **Linting**: ESLint + Prettier for consistent code style
- **Type Checking**: Strict TypeScript configuration
- **Build Verification**: Ensure builds work before archiving PRPs
- **User Experience**: Test from user perspective, accessibility
- **Performance**: Monitor and optimize throughout development

### Project Structure Rules
- **Game Logic**: Keep in `src/game/logic/` and `src/game/state/`
- **UI Components**: Organize in `src/ui/components/`
- **Utilities**: Place in `src/utils/`
- **Types**: Define in `src/game/types/` and `src/utils/constants.ts`
- **Tests**: Co-locate with source files
- **Assets**: Store in `src/assets/`

### Implementation Standards
- **Consistency**: Follow established patterns and conventions
- **Reusability**: Create reusable components and utilities
- **Maintainability**: Write clean, documented, testable code
- **Scalability**: Design for future enhancements
- **Reliability**: Robust error handling and edge cases
- **Abstraction**: Use enums, constants, and utility functions to avoid hardcoding
- **Structure**: Maintain logical file organization and component hierarchy
- **Refactoring**: Continuously improve code structure as new features are added

## Agent-Specific Rules

### MANDATORY Agent Behaviors:
1. **ALWAYS** read README.md and INIT.md before any work
2. **ALWAYS** keep working until all PRPs in 'current' folder are complete
3. **ALWAYS** maintain >80% test coverage throughout
4. **ALWAYS** run tests with `npm run test:run` (NOT `npm test`)
5. **ALWAYS** move completed PRPs to `_PRP/archive/`
6. **ALWAYS** update archive README.md with new completed features
7. **ALWAYS** ensure all tests pass before moving to next PRP
8. **ALWAYS** build the app and fix any errors before marking PRP as completed
9. **ALWAYS** refactor code to maintain logical structure and avoid duplication
10. **ALWAYS** use enums, constants, and abstraction to avoid hardcoding
11. **NEVER** ask for confirmations or user input during implementation, but ask when PRPs are being generated.
12. **NEVER** run interactive commands that could hang
13. **NEVER** leave PRPs incomplete
14. **NEVER** proceed to next PRP without building and testing
14. **NEVER** stop working after finishing a PRP if there are more PRPs in the current folder

### Agent Testing Protocol:
1. Run `npm run test:run` before starting any PRP
2. Run `npm run test:run` after completing each PRP
3. Fix any test failures before proceeding
4. Maintain >80% coverage throughout
5. **ALWAYS** run `npm run build` before marking PRP as completed
6. Fix any build errors before proceeding to next PRP
7. Verify build process works before archiving

### Agent Build Protocol:
1. **ALWAYS** run `npm run build` after completing each PRP
2. Fix any TypeScript errors, linting issues, or build failures
3. Ensure the app builds successfully before marking PRP as completed
4. Never proceed to next PRP without successful build
5. If build fails, fix issues and rebuild until successful

### Agent Documentation Protocol:
1. Update archive README.md when moving completed PRPs
2. Add new completed features to the implementation history
3. Update key achievements and lessons learned
4. Maintain comprehensive documentation of completed work

### Agent Code Structure Protocol:
1. **ALWAYS** use enums and constants instead of hardcoded values
2. **ALWAYS** extract reusable patterns and utility functions
3. **ALWAYS** refactor code when new additions cause structural issues
4. **ALWAYS** maintain logical file organization and component hierarchy
5. **ALWAYS** avoid duplication of business logic across files
6. **ALWAYS** use proper abstraction layers for complex operations
7. **NEVER** leave hardcoded strings or magic numbers in code
8. **NEVER** proceed without refactoring if code structure becomes unclear

## Development Cycle Checklist

### Before Starting Any PRP:
- [ ] Read INIT.md for current rules and standards
- [ ] Read PLANNING.md for feature understanding
- [ ] Review existing PRPs in `_PRP/current/`
- [ ] Ensure development environment is properly set up
- [ ] Verify all tests pass before starting new work

### During PRP Implementation:
- [ ] Follow TDD approach (tests first)
- [ ] Use design system tokens consistently
- [ ] Implement comprehensive error handling
- [ ] Add accessibility features
- [ ] Write clear documentation
- [ ] Test thoroughly before completion

### After PRP Completion:
- [ ] Run `npm run test:run` to ensure no regressions
- [ ] Run `npm run build` to verify build process
- [ ] Fix any build errors before proceeding
- [ ] Refactor code if needed to maintain logical structure
- [ ] Update documentation as needed
- [ ] Move PRP to `_PRP/archive/`
- [ ] Update archive README.md with new completed features
- [ ] Update project status tracking
- [ ] Review lessons learned for future PRPs

### Quality Gates:
- [ ] All tests pass (>80% coverage)
- [ ] No TypeScript errors
- [ ] No linting warnings
- [ ] Build completes successfully (`npm run build`)
- [ ] Code structure is logical and well-organized
- [ ] No hardcoded values or duplicated business logic
- [ ] Accessibility requirements met
- [ ] Performance benchmarks achieved

## File Organization

```
_PRP/
├── INIT.md                    # Development cycle and rules (this file)
├── PLANNING.md                # Feature descriptions (user-facing)
├── PLANNING_TEMPLATE.md       # Markdown scaffolding template
├── current/                   # Active PRPs to be implemented
│   ├── PRP...md
│   └── ...
└── archive/                   # Completed PRPs
    ├── PRP...md
    └── ...
```

## Success Metrics

- **Code Quality**: >80% test coverage, no linting errors
- **Performance**: <100ms component renders, optimized bundles
- **Accessibility**: WCAG 2.1 AA compliance
- **Reliability**: <1% test flakiness, robust error handling
- **Maintainability**: Clear documentation, consistent patterns
- **Code Structure**: Logical organization, no duplication, proper abstraction
- **Build Process**: Successful builds with no errors
- **User Experience**: Intuitive interface, responsive design
- **Completion**: All PRPs in 'current' folder implemented and archived
- **Documentation**: Archive README.md updated with new completed features

## Getting Started

1. **Read this file (INIT.md)** - Understand development rules
2. **Read PLANNING.md** - Understand feature requirements
3. **Review current PRPs** - See what needs implementation
4. **Follow development cycle** - Implement PRPs sequentially
5. **Archive completed work** - Maintain clean project structure
6. **Update documentation** - Keep archive README.md current

## References

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)

This structure ensures consistent, high-quality development with clear processes and maintainable codebase for the Lines game project. 
