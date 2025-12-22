# Contributing to MetaDJ Nexus

**Last Modified**: 2025-12-19 21:04 EST

Thank you for your interest in contributing to MetaDJ Nexus. This guide covers the development workflow, code standards, and submission process.

## Quick Start

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- npm (comes with Node.js)
- Git

### Development Setup

```bash
# Clone the repository
git clone git@github.com:Zuberverse/metadj-nexus.git metadj-nexus
cd metadj-nexus

# Install dependencies
npm install

# Copy environment template and configure
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
npm run dev
```

### Development Server Options

```bash
npm run dev           # Webpack dev + HTTPS (default, most stable)
npm run dev:turbo     # Turbopack dev + HTTPS
npm run dev:http      # Webpack dev + HTTP fallback
npm run dev:http:turbo # Turbopack dev + HTTP fallback
npm run dev:replit    # Replit port 5000
```

## Code Standards

### Required Reading

Before contributing, review these core documents:

1. **[NAMING-CONVENTIONS.md](docs/NAMING-CONVENTIONS.md)** — File naming, component naming, terminology
2. **[CLAUDE.md](CLAUDE.md)** — Development standards and AI integration
3. **[docs/QUICKSTART.md](docs/QUICKSTART.md)** — Developer quickstart guide

### Key Standards

- **TypeScript**: Strict mode enabled, no `any` types without justification
- **React**: Functional components with hooks, use Context providers
- **Styling**: Tailwind CSS with OKLCH color tokens from `globals.css`
- **Naming**: PascalCase for components, kebab-case for utilities
- **Terminology**: Use "feature" not "module"; use collection terminology for releases

### Pre-Commit Checklist

Before committing, ensure:

```bash
npm run lint          # ESLint (must pass with 0 warnings)
npm run type-check    # TypeScript (must pass)
npm run test          # Vitest (must pass)
npm run build         # Production build (must succeed)
```

## Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Follow code standards above
- Update documentation alongside code changes
- Add tests for new functionality

### 3. Update Documentation

**MANDATORY**: Documentation must be updated with code changes.

- Update relevant `docs/features/*.md` specs
- Update `CHANGELOG.md` (Unreleased section)
- Update `docs/reference/*.md` if hooks/contexts change
- See `docs/reference/code-to-docs-map.md` for where to document changes

### 4. Run Quality Checks

```bash
npm run lint && npm run type-check && npm run test && npm run build
```

All checks must pass before submitting.

### 5. Submit PR

Use the PR template (`.github/PULL_REQUEST_TEMPLATE.md`) which includes:

- Type of change (feature, fix, refactor, etc.)
- Description of changes
- Testing checklist
- Accessibility checklist

## Testing

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### Writing Tests

- Place unit tests in `tests/` mirroring the `src/` structure
- Use Vitest for unit/integration tests
- Follow Arrange-Act-Assert pattern
- See `docs/TESTING.md` for full testing guide

## Code Review Expectations

PRs will be reviewed for:

- [ ] Code follows naming conventions
- [ ] TypeScript types are accurate (no `any` abuse)
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] No console.log statements (use logger)
- [ ] Accessibility considerations addressed
- [ ] No security vulnerabilities introduced

## Reporting Issues

Use GitHub Issues with the bug report template. Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots if applicable

## Getting Help

- Check existing documentation in `docs/`
- Review `CHANGELOG.md` for recent changes
- Open a GitHub Discussion for questions

---

**Note**: MetaDJ Nexus is primarily developed by a solo founder with AI assistance. Contributions that include clear documentation and follow established patterns are especially appreciated.
