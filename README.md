# TDLMA - Tensai Devs Lunch Management App

A comprehensive lunch management system for Tensai Devs, Shinkiari Mansehra, built with Next.js and modern web technologies.

## Overview

TDLMA (Tensai Devs Lunch Management App) is a full-featured web application designed to manage lunch bookings, attendance tracking, menu planning, payments, and feedback for organizations. The system supports multiple user roles (Users, Admins, and Super Admins) with granular permission management.

## Technology Stack

- **Framework**: Next.js 16.0.7 (App Router)
- **Language**: TypeScript 5
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI primitives
- **Database**: PostgreSQL (via Neon Serverless)
- **ORM**: Drizzle ORM 0.45.0
- **Authentication**: Cookie-based with bcryptjs password hashing
- **Email**: Nodemailer (SMTP)
- **Charts**: Recharts 3.5.1
- **Icons**: Lucide React

## Features

### User Features
- Dashboard with attendance calendar
- Open/close meal slots
- View today's menu
- Submit and track feedback
- View payment history and dues
- Manage notifications
- Profile management

### Admin Features
- Mark and view attendance
- Menu management (weekly menus with Even/Odd weeks)
- Guest management
- Payment processing (paid, reduced, waived)
- Feedback management and responses
- Reports and analytics
- Off days management
- System settings configuration
- Send notifications

### Super Admin Features
- All admin features
- User management (create, edit, activate/deactivate)
- Permission management (module-based)
- Audit logs
- Notification preferences configuration

## Prerequisites

- Node.js 20 or higher
- PostgreSQL database (Neon Serverless recommended)
- SMTP email server (for password reset and email verification)
- npm, yarn, pnpm, or bun package manager

## Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd tdlma
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory (see `.env.example` for reference):
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Email Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=your-email@domain.com
SMTP_FROM_NAME=TDLMA – Tensai Devs

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

4. Set up the database:
```bash
# Generate migration files (if schema changes)
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

3. Access the database studio (optional):
```bash
npm run db:studio
```

## Building for Production

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm run start
```

The build script (`scripts/build.js`) filters out middleware deprecation warnings during the build process.

## Database Migrations

The application uses Drizzle ORM for database management:

- **Generate migrations**: `npm run db:generate` - Creates migration files based on schema changes
- **Push schema**: `npm run db:push` - Directly pushes schema changes to database (development)
- **Run migrations**: `npm run db:migrate` - Applies migration files (production)
- **Database studio**: `npm run db:studio` - Opens Drizzle Studio for database inspection

## Environment Variables

### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SMTP_USER` - SMTP email address
- `SMTP_PASSWORD` - SMTP email password
- `NEXT_PUBLIC_APP_URL` - Base URL of the application

### Optional Variables

- `SMTP_HOST` - SMTP server host (default: smtp.hostinger.com)
- `SMTP_PORT` - SMTP server port (default: 465)
- `SMTP_SECURE` - Use SSL/TLS (default: true)
- `SMTP_FROM` - Email sender address (defaults to SMTP_USER)
- `SMTP_FROM_NAME` - Email sender name (default: "TDLMA – Tensai Devs")
- `NODE_ENV` - Environment mode (development/production)

## Project Structure

```
tdlma/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin routes
│   ├── api/               # API routes
│   ├── user/              # User routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── user/              # User-specific components
│   └── ui/                # Reusable UI components
├── lib/                   # Library code
│   ├── db/                # Database schema and configuration
│   ├── middleware/        # Middleware functions
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── scripts/               # Build and utility scripts
├── public/                # Static assets
└── drizzle/               # Database migration files
```

## Deployment

### Vercel (Recommended)

1. Push your code to a Git repository
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

The application includes a `vercel.json` configuration for cron jobs (daily attendance creation).

### Other Platforms

1. Set all required environment variables
2. Run `npm run build`
3. Start the server with `npm run start`
4. Ensure PostgreSQL database is accessible
5. Configure SMTP settings for email functionality

## Production Checklist

Before deploying to production:

- [ ] All environment variables are set
- [ ] Database migrations are applied
- [ ] SMTP email configuration is tested
- [ ] `NODE_ENV` is set to `production`
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain
- [ ] Database connection is secure and accessible
- [ ] Build process completes without errors
- [ ] All routes are properly protected
- [ ] Error handling is in place
- [ ] Logging is configured (if needed)

## Security Considerations

- Passwords are hashed using bcryptjs
- Authentication uses httpOnly cookies
- API routes are protected with middleware
- Input validation on all user inputs
- SQL injection protection via Drizzle ORM
- Email enumeration prevention
- Role-based access control (RBAC)

## Documentation

- [User Manual](docs/USER_MANUAL.md) - Complete guide for end users
- [Admin Manual](docs/ADMIN_MANUAL.md) - Complete guide for administrators

## Support

For issues, questions, or contributions, please contact the development team.

## License

Private - All rights reserved.
