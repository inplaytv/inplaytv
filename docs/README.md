# Documentation Index

All project documentation organized in one place.

## Quick Start

**New to the project? Start here:**
1. 📋 [00-PROJECT-STATUS.md](./00-PROJECT-STATUS.md) - Current state
2. 🚀 [01-SETUP-GUIDE.md](./01-SETUP-GUIDE.md) - Initial setup
3. 🧪 [03-TESTING-AUTH.md](./03-TESTING-AUTH.md) - Test authentication

## Documentation Files

### Project Management
- **00-PROJECT-STATUS.md** - Current status, completed features, next actions
- **05-FEATURE-ROADMAP.md** - Planned features, implementation phases
- **08-PROJECT-STRUCTURE.md** - Complete file tree and organization

### Setup & Configuration
- **01-SETUP-GUIDE.md** - Complete setup instructions for Supabase and environment
- **02-ENVIRONMENT-SETUP.md** - Environment variables reference and security
- **06-DATABASE-SCHEMA.md** - Complete PostgreSQL schema and migration plan

### Development
- **04-DEVELOPMENT-WORKFLOW.md** - Daily commands, git workflow, code organization
- **07-TECH-STACK.md** - Technologies used, versions, and rationale

### Testing
- **03-TESTING-AUTH.md** - Authentication testing flow and troubleshooting

## File Structure

```
docs/
├── README.md                    ← You are here
├── 00-PROJECT-STATUS.md         ← Start here
├── 01-SETUP-GUIDE.md
├── 02-ENVIRONMENT-SETUP.md
├── 03-TESTING-AUTH.md
├── 04-DEVELOPMENT-WORKFLOW.md
├── 05-FEATURE-ROADMAP.md
├── 06-DATABASE-SCHEMA.md
├── 07-TECH-STACK.md
└── 08-PROJECT-STRUCTURE.md      ← Visual file tree
```

## When to Read Each File

### I'm just starting
→ Read: 00, 01, 02, 03 (in order)

### I'm developing features
→ Read: 04, 05, 06

### I need to understand the tech
→ Read: 07

### I need to fix something
→ Search relevant file for troubleshooting section

## Keeping Docs Updated

This folder contains the **single source of truth** for the project.

**Rules:**
1. ✅ Update docs when making significant changes
2. ✅ Keep PROJECT-STATUS.md current
3. ✅ Document decisions in relevant files
4. ❌ Don't create random README files elsewhere
5. ❌ Don't let docs become stale

**How to Update:**
```bash
# Edit the relevant doc file
code docs/00-PROJECT-STATUS.md

# Commit with the feature
git add docs/
git commit -m "feat: Add tournament listing + update docs"
```

## External Resources

### Official Docs
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)

### Community Resources
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Vercel Discussions](https://github.com/vercel/next.js/discussions)

## Getting Help

1. **Check documentation first** (you're here!)
2. **Search error messages** in browser console
3. **Check Supabase logs** for backend issues
4. **Read official docs** for framework-specific questions
5. **Ask in communities** (Discord, Reddit, Stack Overflow)

## Contributing to Docs

Found something unclear or outdated?

1. Update the relevant markdown file
2. Keep formatting consistent
3. Add examples where helpful
4. Commit with descriptive message

---

**Last Updated:** October 16, 2025  
**Project:** Fantasy Golf Monorepo  
**Status:** Phase 1 Complete, Phase 2 In Progress
