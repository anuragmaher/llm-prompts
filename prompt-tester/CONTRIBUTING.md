# Contributing to LLM Prompt Tester

Thank you for your interest in contributing to the LLM Prompt Tester! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful** and inclusive in all interactions
- **Be collaborative** and constructive in discussions
- **Be patient** with newcomers and those learning
- **Be mindful** of different perspectives and experiences

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git
- Basic knowledge of React and TypeScript

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/llm-prompt-tester.git
   cd llm-prompt-tester
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Add your API keys for testing
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes** - Fix existing functionality
- ✨ **New features** - Add new capabilities  
- 📝 **Documentation** - Improve or add documentation
- 🎨 **UI/UX improvements** - Enhance user experience
- ⚡ **Performance** - Optimize existing code
- 🧪 **Tests** - Add or improve test coverage

### Before You Start

1. **Check existing issues** - Avoid duplicate work
2. **Create an issue** - Discuss your idea before implementing
3. **Get approval** - Wait for maintainer feedback on larger changes
4. **Follow conventions** - Match existing code style and patterns

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type annotations
- Avoid `any` type unless absolutely necessary
- Use interfaces for object shapes

```typescript
// Good
interface ApiResponse {
  success: boolean;
  data?: string;
  error?: string;
}

// Avoid
const response: any = await apiCall();
```

### React Components

- Use functional components with hooks
- Follow naming conventions: `PascalCase` for components
- Extract reusable logic into custom hooks
- Use proper prop types

```typescript
// Good
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, disabled, children }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};
```

### CSS/Styling

- Follow existing glassmorphism design patterns
- Use consistent naming: `kebab-case` for CSS classes
- Maintain responsive design principles
- Add smooth transitions for interactions

```css
/* Good */
.panel-header {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  transition: all 0.2s ease;
}

.panel-header:hover {
  background: rgba(255, 255, 255, 0.1);
}
```

### File Organization

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles and themes
```

### API Integration

- Use the existing `apiService.ts` pattern
- Handle errors gracefully
- Implement proper loading states
- Support both streaming and standard responses

### State Management

- Use React hooks for local state
- Use localStorage for persistence
- Follow existing patterns for data flow
- Avoid prop drilling with proper component structure

## Testing

### Test Requirements

- **Unit tests** for utility functions
- **Component tests** for UI components
- **Integration tests** for API services
- **E2E tests** for critical user flows

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Submitting Changes

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation if needed

3. **Test thoroughly**
   ```bash
   npm test
   npm run build
   npm run lint
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add streaming response support"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create pull request**
   - Use the PR template
   - Provide clear description
   - Reference related issues

### Commit Message Convention

Follow [Conventional Commits](https://conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```bash
feat: add collapsible panel functionality
fix: resolve streaming timeout issue
docs: update API integration guide
style: improve glassmorphism effects
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Existing tests pass
- [ ] New tests added
- [ ] Manual testing completed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Environment details**
   - Browser and version
   - Operating system
   - Node.js version (for setup issues)

2. **Steps to reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots if helpful

3. **Additional context**
   - Error messages
   - Console logs
   - Related configuration

### Feature Requests

For new features, provide:

1. **Problem description** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Alternatives considered** - Other approaches you've thought of
4. **Use cases** - When would this be useful?

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or improvement
- `documentation` - Documentation needs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high/medium/low` - Importance level

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Code Review Process

1. **Automated checks** must pass
2. **At least one maintainer** review required
3. **Address feedback** promptly
4. **Squash and merge** for clean history

### Release Process

- Semantic versioning (MAJOR.MINOR.PATCH)
- Changelog updates for all releases
- Testing on multiple browsers/environments
- Documentation updates as needed

## Getting Help

### Resources

- [User Guide](docs/USER_GUIDE.md) - Using the application
- [API Guide](docs/API_GUIDE.md) - Technical integration
- [README](README.md) - Project overview

### Communication

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Email** - Private or sensitive matters

### Mentorship

New contributors are welcome! Look for:
- Issues labeled `good first issue`
- Documentation improvements
- Small bug fixes
- UI enhancements

Don't hesitate to ask questions or request guidance.

## Recognition

Contributors will be recognized:
- In the project README
- In release notes for significant contributions
- Through GitHub's contributor statistics

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to LLM Prompt Tester! Your help makes this project better for everyone. 🚀