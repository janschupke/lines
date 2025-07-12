# Development Workflow & Agent Instructions

## Overview

This folder contains the project planning and implementation documentation for the Lines project. The development workflow is designed to be repeatable and can be executed by both developers and AI agents.

## Folder Structure

```
_PRP/
├── README.md                    # This file - complete workflow instructions
├── INIT.md                      # Development cycle and rules (source of truth)
├── PLANNING.md                  # Feature descriptions (input by developer/
├── PLANNING_TEMPLATE.md                  # TODO
├── current/                     # Active PRPs to be implemented
│   └── (empty - ready for new PRPs)
└── archive/                     # Completed PRPs
    ├── PRP-...md
    ├── ...
```

## Development Workflow

### Phase 1: Planning (Developer Input)
**Developer Action**: Create or update `PLANNING.md` with new feature descriptions
- **Content**: Non-technical, user-facing feature descriptions
- **Format**: Clear, concise descriptions of what users will see/experience
- **Scope**: Complete feature set to be implemented
- **Examples**: "Users can open folders", "Users can edit files with syntax highlighting"

### Phase 2: PRP Generation (Agent Action)
**Agent Instruction**: "Read README.md and INIT.md, then generate PRPs for the features in PLANNING.md"

**Agent Requirements**:
- Read README.md and INIT.md as source of truth
- Analyze PLANNING.md for feature requirements
- Generate detailed PRP documents in `_PRP/current/`
- Follow PRP-[YYYY]-[MM]-[DD]-[number]-[feature].md naming convention
- Include complete implementation details

**PRP Content Requirements**:
- Functional requirements (what the feature does)
- Non-functional requirements (performance, security, etc.)
- User-facing descriptions (UI/UX)
- Technical implementation details
- Code examples and references to existing codebase
- Testing requirements and coverage targets
- Potential risks and mitigation strategies
- Accessibility requirements
- Performance considerations

### Phase 3: Implementation (Agent Action)
**Agent Instruction**: "Implement all PRPs in the current folder"

**Agent Requirements**:
- **MANDATORY**: Read README.md and INIT.md before each PRP
- **MANDATORY**: Keep working until all PRPs in 'current' folder are complete
- **MANDATORY**: Maintain >80% test coverage throughout
- **MANDATORY**: Ensure all tests pass before moving to next PRP
- **MANDATORY**: Run tests in non-watch mode: `npm run test:run`
- **MANDATORY**: Do NOT run interactive commands that could hang
- **MANDATORY**: Do NOT ask for confirmations - keep working automatically
- **MANDATORY**: Move completed PRPs to `_PRP/archive/` after implementation
- **MANDATORY**: Update archive README.md with new completed features

## Agent Instructions & Restrictions

### Before Starting Any Work:
1. **ALWAYS** read README.md and INIT.md first
2. **ALWAYS** understand the development cycle and rules
3. **ALWAYS** check current folder for active PRPs
4. **ALWAYS** verify test environment is working

### During Implementation:
1. **MANDATORY**: Follow TDD approach (tests first)
2. **MANDATORY**: Use design system tokens consistently
3. **MANDATORY**: Implement comprehensive error handling
4. **MANDATORY**: Add accessibility features
5. **MANDATORY**: Write clear documentation
6. **MANDATORY**: Test thoroughly before completion

### Testing Requirements:
1. **MANDATORY**: Run `npm run test:run` (NOT `npm test`)
2. **MANDATORY**: Ensure all tests pass before proceeding
3. **MANDATORY**: Maintain >80% test coverage
4. **MANDATORY**: Fix any test failures before moving to next PRP

### Quality Gates:
- [ ] All tests pass (>80% coverage)
- [ ] No TypeScript errors
- [ ] No linting warnings
- [ ] Build completes successfully
- [ ] Accessibility requirements met
- [ ] Performance benchmarks achieved

### Completion Requirements:
1. **MANDATORY**: Move completed PRP to `_PRP/archive/`
2. **MANDATORY**: Update archive README.md with new completed features
3. **MANDATORY**: Update documentation as needed
4. **MANDATORY**: Verify no regressions in existing functionality
5. **MANDATORY**: Continue until all PRPs in 'current' are complete

## How to Provide Prompts to Agent

### For PRP Generation:
```
Read README.md and INIT.md, then generate PRPs for the features in PLANNING.md. 
Create detailed, well-researched PRP documents in the 'current' folder that contain 
complete information about the features to be implemented, including functional requirements, 
non-functional requirements, user-facing descriptions, technical details, code examples, 
testing requirements, potential risks, and accessibility considerations. Use the naming 
convention PRP-[YYYY]-[MM]-[DD]-[number]-[feature].md with today's date.
```

### For Implementation:
```
Read README.md and INIT.md, then implement all PRPs in the current folder. 
Keep working until all PRPs are complete. Maintain >80% test coverage and ensure 
all tests pass. Run tests with 'npm run test:run' only. Do not ask for confirmations 
or run interactive commands. Move completed PRPs to archive when done and update 
the archive README.md with new completed features.
```

### For Feature Planning:
```
Update PLANNING.md with the following user-facing feature descriptions:

[describe features]. 

Focus on what users will experience, not technical implementation details.
```

## PRP Naming Convention

### Format: `PRP-[YYYY]-[MM]-[DD]-[number]-[feature].md`

**Examples:**
- `PRP-2024-01-15-01-Design-System-Testing-Foundation.md`
- `PRP-2024-01-15-02-Setup.md`
- `PRP-2024-01-15-03-UI-Skeleton.md`

**Components:**
- `[YYYY]`: Four-digit year
- `[MM]`: Two-digit month (01-12)
- `[DD]`: Two-digit day (01-31)
- `[number]`: Sequential number within the feature set (01, 02, 03, etc.)
- `[feature]`: Descriptive feature name (kebab-case)

**Benefits:**
- Files sort chronologically in filesystem
- Clear date tracking for feature sets
- Sequential numbering within feature sets
- Descriptive feature names for easy identification

## File Descriptions

### Core Files
- **README.md**: This file - complete workflow instructions
- **INIT.md**: Development rules and cycle (source of truth)
- **PLANNING.md**: Feature descriptions (input by developer/agent)

### Implementation Folders
- **current/**: Active PRPs to be implemented
- **archive/**: Completed PRPs (preserved for reference)

## Success Metrics

- All PRPs in `current/` are implemented
- All completed PRPs are in `archive/`
- >80% test coverage maintained
- All tests pass consistently
- No interactive commands or hanging processes
- Code quality standards maintained
- Documentation is current and comprehensive
- Archive README.md is updated with new completed features

## Agent Behavior Rules

### DO:
- Read README.md and INIT.md before any work
- Generate comprehensive PRPs with all details
- Implement features completely and thoroughly
- Run tests with `npm run test:run` only
- Move completed PRPs to archive
- Update archive README.md with new completed features
- Maintain high test coverage
- Follow all quality standards

### DON'T:
- Run interactive commands that could hang
- Ask for confirmations or user input
- Use `npm test` (use `npm run test:run`)
- Skip reading README.md and INIT.md
- Leave PRPs incomplete
- Ignore test failures
- Forget to move completed PRPs to archive
- Forget to update archive README.md

This workflow ensures consistent, high-quality development with clear processes and automated completion of feature sets. 
