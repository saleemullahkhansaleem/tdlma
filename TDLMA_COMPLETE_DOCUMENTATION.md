# TDLMA (Tensai Devs Lunch Management App) - Complete Documentation

## Project Overview

TDLMA is a comprehensive Lunch Management Application designed for Tensai Devs in Shinkiari Mansehra. The application manages employee/student cafeteria attendance, menu planning, feedback collection, and administrative oversight for meal services.

**Project Type**: Web Application
**Technology Stack**: Next.js 16, React 19, TypeScript, PostgreSQL, Drizzle ORM
**Deployment**: Vercel with automated cron jobs
**Target Users**: Employees and students of Tensai Devs

## Table of Contents

1. [Architecture & Tech Stack](#architecture--tech-stack)
2. [Database Schema](#database-schema)
3. [Authentication & Authorization](#authentication--authorization)
4. [Core Features](#core-features)
5. [User Roles & Permissions](#user-roles--permissions)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Automated Processes](#automated-processes)
9. [Email System](#email-system)
10. [Deployment & Configuration](#deployment--configuration)
11. [Setup Instructions](#setup-instructions)

## Architecture & Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Component Library**: Radix UI (via shadcn/ui)
- **Icons**: Lucide React
- **State Management**: React Context API
- **Type Safety**: TypeScript

### Backend
- **Runtime**: Next.js API Routes
- **Database**: PostgreSQL (Neon Database)
- **ORM**: Drizzle ORM
- **Authentication**: HTTP-only cookies with bcrypt password hashing
- **Email Service**: Nodemailer with SMTP
- **Validation**: Server-side validation

### Infrastructure
- **Hosting**: Vercel
- **Database Hosting**: Neon (PostgreSQL)
- **Automated Tasks**: Vercel Cron Jobs
- **Environment Management**: Environment variables

## Database Schema

The application uses 9 main tables with comprehensive relationships:

### Core Tables

#### 1. Users Table
```sql
- id: UUID (Primary Key)
- name: VARCHAR(255)
- email: VARCHAR(255) UNIQUE
- password_hash: VARCHAR(255)
- role: ENUM('user', 'admin', 'super_admin')
- status: ENUM('Active', 'Inactive')
- designation: VARCHAR(255)
- userType: ENUM('employee', 'student')
- avatarUrl: VARCHAR(512)
- createdAt, updatedAt: TIMESTAMP
```

#### 2. Menus Table
```sql
- id: UUID (Primary Key)
- dayOfWeek: ENUM('Monday' to 'Saturday')
- weekType: ENUM('Even', 'Odd')
- menuItems: JSON (Array of menu items with names and images)
- createdAt, updatedAt: TIMESTAMP
```

#### 3. Attendance Table
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key → users.id)
- date: DATE
- mealType: ENUM('Breakfast', 'Lunch', 'Dinner')
- status: ENUM('Present', 'Absent')
- isOpen: BOOLEAN (default: true)
- fineAmount: DECIMAL(10,2)
- createdAt, updatedAt: TIMESTAMP
```

#### 4. Reports Table
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key → users.id)
- totalOpened: INTEGER
- totalClosed: INTEGER
- totalUnopened: INTEGER
- totalUnclosed: INTEGER
- totalFine: DECIMAL(10,2)
- reportDate: DATE
- createdAt, updatedAt: TIMESTAMP
```

#### 5. Guests Table
```sql
- id: UUID (Primary Key)
- inviterId: UUID (Foreign Key → users.id)
- name: VARCHAR(255)
- date: DATE
- mealType: ENUM('Breakfast', 'Lunch', 'Dinner')
- createdAt, updatedAt: TIMESTAMP
```

#### 6. Settings Table (Single Row)
```sql
- id: UUID (Primary Key)
- closeTime: VARCHAR(5) - Format: HH:mm (default: '18:00')
- fineAmountUnclosed: DECIMAL(10,2)
- fineAmountUnopened: DECIMAL(10,2)
- createdAt, updatedAt: TIMESTAMP
```

#### 7. Feedback Table
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key → users.id)
- category: ENUM('Food', 'Meal Timing', 'Service', 'Attendance', 'App', 'Menu', 'Environment', 'Suggestion', 'Other')
- type: ENUM('Suggestion', 'Complaint', 'Feedback')
- title: VARCHAR(255)
- description: TEXT
- status: ENUM('Pending', 'Reviewed', 'Resolved')
- response: TEXT
- createdAt, updatedAt: TIMESTAMP
```

#### 8. Off Days Table
```sql
- id: UUID (Primary Key)
- date: DATE UNIQUE
- reason: TEXT
- createdAt, updatedAt: TIMESTAMP
```

#### 9. Password Reset Tokens Table
```sql
- id: UUID (Primary Key)
- userId: UUID (Foreign Key → users.id)
- token: VARCHAR(255) UNIQUE
- expiresAt: TIMESTAMP
- used: BOOLEAN (default: false)
- createdAt: TIMESTAMP
```

## Authentication & Authorization

### Authentication Flow
1. **Login**: Email/password authentication with bcrypt hashing
2. **Session Management**: HTTP-only cookies containing user ID and role
3. **Middleware Protection**: Route-level protection based on user roles
4. **Auto-redirect**: Based on user role after login

### Password Security
- **Hashing**: bcryptjs with salt rounds
- **Reset Flow**: Token-based password reset via email
- **Token Expiry**: 24 hours for reset tokens

### Route Protection
- **Public Routes**: `/login`, `/forgot-password`, `/reset-password`
- **User Routes**: `/user/*` (only regular users)
- **Admin Routes**: `/admin/*` (admin and super_admin only)
- **Root Redirect**: Based on user role

## Core Features

### 1. User Dashboard
**Location**: `/user/dashboard`

#### Features:
- **Weekly Timetable**: Shows 7-day meal schedule with menu items
- **Attendance Management**: Open/close meal status with time restrictions
- **Statistics Display**: Personal attendance stats and fines
- **Real-time Updates**: Live status changes and calculations
- **Filter Options**: View different time periods (This Week, Last Week, etc.)

#### Key Functionality:
- Users can toggle meal status (Open/Close) before close time
- Automatic fine calculation for unclosed/unopened meals
- Visual indicators for off-days and holidays
- Responsive design for mobile and desktop

### 2. Menu Management (Admin)
**Location**: `/admin/menu`

#### Features:
- **Weekly Menu Planning**: Separate menus for Even/Odd weeks
- **Menu CRUD Operations**: Create, read, update, delete menu items
- **Image Upload Support**: Menu items can have associated images
- **Day-wise Organization**: Monday to Saturday scheduling
- **Bulk Operations**: Efficient menu management

### 3. Attendance Management (Admin)
**Location**: `/admin/mark-attendance`, `/admin/view-attendance`

#### Features:
- **Manual Attendance Marking**: Admin can mark attendance for users
- **Bulk Operations**: Mark multiple users at once
- **Date Filtering**: View attendance by specific dates
- **Status Tracking**: Present/Absent status management
- **Guest Management**: Add guests for specific meals

### 4. User Management (Super Admin Only)
**Location**: `/admin/users`

#### Features:
- **User CRUD Operations**: Create, edit, delete users
- **Role Management**: Assign user/admin/super_admin roles
- **Status Control**: Activate/deactivate user accounts
- **Bulk Import**: Efficient user management
- **Filtering**: Filter by role, status, user type

### 5. Feedback System
**Location**: `/user/feedback`, `/admin/feedback`

#### Features:
- **Multi-category Feedback**: Food, Service, Timing, App, etc.
- **Feedback Types**: Suggestion, Complaint, General Feedback
- **Admin Response System**: Admins can respond to feedback
- **Status Tracking**: Pending → Reviewed → Resolved workflow
- **Anonymous Option**: Users can submit feedback anonymously

### 6. Reports & Analytics
**Location**: `/admin/view-reports`

#### Features:
- **User-wise Reports**: Individual user attendance summaries
- **Date Range Filtering**: Custom report periods
- **Fine Calculations**: Automatic fine amount calculations
- **Export Capabilities**: Data export for external analysis
- **Dashboard Charts**: Visual representation of attendance data

### 7. Settings Management
**Location**: `/admin/settings`

#### Features:
- **Global Settings**: Close time configuration
- **Fine Amount Configuration**: Set fines for violations
- **System-wide Parameters**: Centralized configuration
- **Real-time Updates**: Immediate effect on calculations

### 8. Off Days Management
**Location**: Admin Settings/Off Days Manager

#### Features:
- **Holiday Management**: Mark dates as off-days
- **Reason Tracking**: Document reasons for closures
- **Future Planning**: Schedule upcoming off-days
- **Automatic Exclusion**: Off-days excluded from attendance calculations

## User Roles & Permissions

### 1. Regular User (`user`)
**Permissions:**
- View personal dashboard and timetable
- Open/close meal attendance (before close time)
- Submit feedback
- View personal profile
- Change password

**Restrictions:**
- Cannot access admin routes
- Cannot modify attendance after close time
- Limited to personal data only

### 2. Admin (`admin`)
**Permissions:**
- All user permissions
- Manage menu (CRUD operations)
- Mark attendance manually
- View attendance records
- Manage feedback (view and respond)
- View reports and analytics
- Access admin dashboard
- Manage off-days
- Configure system settings

**Restrictions:**
- Cannot manage users (user creation/modification)
- Cannot access super-admin only features

### 3. Super Admin (`super_admin`)
**Permissions:**
- All admin permissions
- Full user management (CRUD operations)
- Role assignment and modification
- System-wide administrative control
- Access to all features and data

## API Endpoints

### Authentication APIs
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Password change
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### User APIs
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile

### Admin APIs
- `GET /api/admin/dashboard-stats` - Dashboard statistics
- `GET /api/users` - List all users (Super Admin)
- `POST /api/users` - Create user (Super Admin)
- `PATCH /api/users/[id]` - Update user (Super Admin)
- `DELETE /api/users/[id]` - Delete user (Super Admin)

### Menu APIs
- `GET /api/menu` - Get menu data
- `POST /api/menu` - Create/update menu
- `PATCH /api/menu/[id]` - Update specific menu item
- `DELETE /api/menu/[id]` - Delete menu item

### Attendance APIs
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create attendance record
- `PATCH /api/attendance/[id]` - Update attendance
- `DELETE /api/attendance/[id]` - Delete attendance

### Feedback APIs
- `GET /api/feedback` - Get feedback (filtered by role)
- `POST /api/feedback` - Submit feedback
- `PATCH /api/feedback/[id]` - Update feedback (Admin)
- `GET /api/feedback/admin` - Admin feedback management

### Settings APIs
- `GET /api/settings` - Get system settings
- `PATCH /api/settings` - Update settings

### Guest APIs
- `GET /api/guests` - Get guest records
- `POST /api/guests` - Add guest
- `DELETE /api/guests/[id]` - Remove guest

### Off Days APIs
- `GET /api/off-days` - Get off days
- `POST /api/off-days` - Create off day
- `DELETE /api/off-days/[id]` - Delete off day

### Cron APIs
- `GET /api/cron/create-attendance` - Daily attendance creation

## Frontend Components

### Layout Components
- **Root Layout**: Global providers (Auth, Theme)
- **Admin Layout**: Sidebar navigation + header
- **User Layout**: Minimal layout for user pages

### Admin Components
- **Sidebar**: Collapsible navigation with role-based menu items
- **Header**: User menu, theme toggle, mobile navigation
- **Dashboard Components**: Stats cards, charts, data visualization
- **Data Tables**: Sortable, filterable tables with pagination
- **Forms**: Modal-based CRUD forms with validation

### User Components
- **Dashboard**: Weekly timetable with interactive controls
- **Feedback Forms**: Category-based feedback submission
- **Profile Management**: User profile editing

### Shared UI Components
- **shadcn/ui Components**: Buttons, inputs, dialogs, tables, etc.
- **Charts**: Recharts integration for data visualization
- **Date Pickers**: Custom date filtering components
- **Loading States**: Skeleton loaders and spinners

## Automated Processes

### Daily Attendance Creation
**Schedule**: Every day at midnight (0 0 * * *)
**Function**: Creates attendance records for all active users for lunch
**Location**: `/api/cron/create-attendance`

### Fine Calculation Logic
- **Unclosed Meal**: Meal opened but not closed by user
- **Unopened Meal**: Meal not opened by user (system assumes closed)
- **Fine Amounts**: Configurable via settings
- **Automatic Calculation**: Real-time fine computation

### Report Generation
- **Daily Reports**: Automatic report creation for each user
- **Metrics Tracked**: Opened, closed, unopened, unclosed counts
- **Fine Summation**: Total fines per reporting period

## Email System

### Configuration
- **Provider**: SMTP (Gmail recommended)
- **Authentication**: App passwords for Gmail
- **Templates**: HTML email templates

### Email Types
- **Password Reset**: Token-based reset links
- **Notifications**: System notifications (future feature)
- **Reports**: Automated report emails (future feature)

### Environment Variables Required
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

## Deployment & Configuration

### Vercel Configuration
**vercel.json**:
```json
{
  "crons": [
    {
      "path": "/api/cron/create-attendance",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Environment Variables
**Required Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL`: Application URL
- `CRON_SECRET`: Cron job authentication (optional)
- `NEXT_PUBLIC_STACK_*`: Authentication service keys

**Optional Variables**:
- SMTP configuration for email features

### Database Migrations
**Commands**:
- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Drizzle Studio

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- SMTP email service (Gmail recommended)

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd tdlma
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env.local`
   - Configure database connection
   - Set SMTP credentials
   - Configure authentication keys

4. **Database Setup**
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

### Initial User Setup
Use the seed script to create initial admin users:
```bash
npm run db:seed
```

### Production Deployment
1. **Vercel Deployment**: Connect GitHub repository
2. **Environment Variables**: Configure in Vercel dashboard
3. **Database**: Ensure Neon database is accessible
4. **Cron Jobs**: Configure in Vercel dashboard

## Security Features

### Authentication Security
- HTTP-only cookies prevent XSS attacks
- Password hashing with bcrypt
- Token-based password reset with expiry
- Role-based access control

### Data Protection
- Server-side validation on all inputs
- SQL injection prevention via Drizzle ORM
- CORS configuration for API routes
- Input sanitization

### Session Management
- Secure cookie configuration
- Automatic logout on invalid sessions
- Session timeout handling

## Performance Optimizations

### Frontend Optimizations
- Next.js App Router for efficient routing
- React 19 with concurrent features
- Tailwind CSS for optimized styling
- Lazy loading of components
- Image optimization with Next.js

### Database Optimizations
- Indexed queries for performance
- Connection pooling with Neon
- Efficient ORM queries with Drizzle
- Minimal data fetching strategies

### Caching Strategies
- Static generation where possible
- API response caching
- Database query result caching

## Monitoring & Maintenance

### Logging
- Server-side error logging
- Email delivery status logging
- Database operation logging
- Cron job execution logging

### Error Handling
- Global error boundaries
- API error responses
- User-friendly error messages
- Graceful degradation

### Backup & Recovery
- Database backups via Neon
- Code repository backup via Git
- Environment variable security
- Regular deployment testing

## Future Enhancements

### Planned Features
- **Mobile App**: React Native companion app
- **Push Notifications**: Real-time updates
- **Advanced Analytics**: Detailed reporting dashboards
- **Integration APIs**: Third-party service integrations
- **Multi-language Support**: Internationalization
- **Bulk Import/Export**: Excel/CSV data operations

### Scalability Considerations
- Database sharding for large user bases
- CDN integration for static assets
- Microservices architecture preparation
- API rate limiting implementation

---

**Document Version**: 1.0
**Last Updated**: December 12, 2025
**Author**: TDLMA Development Team
**Contact**: For technical support or questions about this documentation