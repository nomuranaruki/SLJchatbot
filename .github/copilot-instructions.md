<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# SLJ Chatbot - AI-Powered Document Assistant

This is a Next.js 14 TypeScript project with the following tech stack:
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **AI**: OpenAI GPT-4 API
- **Testing**: Jest with Testing Library

## Project Structure

- `/src/app` - Next.js App Router pages and API routes
- `/src/components` - React components (UI components in `/ui` subdirectory)
- `/src/lib` - Utility functions and configurations
- `/src/providers` - React context providers
- `/src/types` - TypeScript type definitions
- `/src/__tests__` - Test files
- `/prisma` - Database schema and migrations

## Coding Standards

1. Use TypeScript for all files
2. Follow Next.js 14 App Router conventions
3. Use shadcn/ui components for UI
4. Implement proper error handling and loading states
5. Write comprehensive tests for all components and utilities
6. Use Prisma for database operations
7. Follow the existing component structure and naming conventions

## Key Features

- Google OAuth authentication
- Document upload and management
- AI-powered chat with document context
- Role-based access control (user/admin)
- File version control
- Audit logging
- External service integrations (Google Drive, Slack)

## Development Guidelines

- Use server components where possible, client components only when needed
- Implement proper loading and error boundaries
- Follow accessibility best practices
- Use responsive design patterns
- Implement proper SEO and metadata
