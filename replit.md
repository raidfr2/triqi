# Interactive Map Application

## Overview

This is a full-stack web application featuring an interactive Mapbox-powered map interface. The application combines a React frontend with an Express.js backend, using PostgreSQL for data persistence through Drizzle ORM. The frontend is built with modern UI components from shadcn/ui and provides a responsive, feature-rich mapping experience with custom styling and interactive controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Components**: shadcn/ui component library with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Map Integration**: Mapbox GL JS for interactive mapping with custom styling support

### Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **Language**: TypeScript with strict type checking enabled
- **API Design**: RESTful API structure with `/api` prefix for all endpoints
- **Development**: tsx for TypeScript execution in development with hot reloading

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Neon Database serverless connection for cloud PostgreSQL
- **Validation**: Zod schemas integrated with Drizzle for runtime type validation
- **Fallback Storage**: In-memory storage implementation for development/testing

### Authentication and Authorization
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **User Schema**: Basic user model with username/password authentication structure
- **Security**: Prepared for authentication implementation with user CRUD operations

### Development Environment
- **Hot Reloading**: Vite development server with HMR for frontend changes
- **Error Handling**: Runtime error overlay for development debugging
- **Code Quality**: TypeScript strict mode with comprehensive type checking
- **Build Process**: Vite for frontend bundling and esbuild for server-side compilation

## External Dependencies

### Core Technologies
- **Mapbox GL JS**: Interactive mapping library with custom style support
- **PostgreSQL**: Primary database system via Neon Database serverless
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect

### UI and Styling
- **Radix UI**: Comprehensive set of low-level UI primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Utility for creating component variants

### Development Tools
- **Vite**: Build tool and development server with React plugin
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

### State Management and Data Fetching
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form handling with validation support
- **Wouter**: Lightweight routing solution for single-page applications

### Environment Configuration
- **Environment Variables**: Mapbox access token and database URL configuration
- **Replit Integration**: Development plugins for enhanced Replit experience
- **CORS and Security**: Express middleware for request handling and security