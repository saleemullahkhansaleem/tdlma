# TDLMA Admin & Super Admin Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Roles & Access Control](#roles--access-control)
3. [Getting Started](#getting-started)
4. [System Configuration](#system-configuration)
5. [User Management](#user-management)
6. [Permission Management](#permission-management)
7. [Module Management](#module-management)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Security Guidelines](#security-guidelines)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

### Admin vs Super Admin Roles

**Admin Role:**
- Can access modules based on assigned permissions
- Cannot manage users or permissions
- Cannot view audit logs
- Cannot configure notification preferences
- Full access to operational modules (menu, attendance, payments, etc.)

**Super Admin Role:**
- Full access to all modules (no permission restrictions)
- Can create, edit, and manage users
- Can assign and modify admin permissions
- Can view audit logs
- Can configure notification preferences
- Can manage all system settings

### System Overview

TDLMA (Tensai Devs Lunch Management App) is a comprehensive lunch management system that handles:
- Meal attendance tracking
- Menu planning and management
- Payment processing and financial tracking
- Guest management
- Feedback management
- User administration
- System configuration

### Access Levels

- **Public Routes**: Login, forgot password, reset password (no authentication required)
- **User Routes**: Dashboard, profile, feedback, transactions (user role only)
- **Admin Routes**: All admin modules (admin or super_admin role required)
- **Super Admin Routes**: Users, permissions, audit logs (super_admin only)

---

## Roles & Access Control

### Admin Capabilities

Regular admins can access modules based on permissions assigned by super admins:

- **Dashboard**: View system overview and KPIs
- **Menu**: Create and manage weekly menus
- **Mark Attendance**: Record user attendance
- **View Attendance**: View attendance records and history
- **Guest Management**: Add and manage guest entries
- **View Reports**: Generate and view user reports
- **Payments**: Process payments, reduce dues, waive amounts
- **Off Days**: Manage holidays and off days
- **Feedback Management**: View and respond to user feedback
- **Send Notifications**: Send notifications to users
- **Settings**: Configure system settings

### Super Admin Capabilities

Super admins have all admin capabilities plus:

- **User Management**: Create, edit, activate/deactivate users
- **Permission Management**: Assign permissions to admins
- **Audit Logs**: View system activity logs
- **Notification Settings**: Configure notification preferences

### Permission Boundaries

- Admins can only access modules they have permission for
- Super admins bypass all permission checks
- Permission changes are logged in audit logs
- Permissions are module-based (granular control)

### Permission Management System

The system uses a module-based permission system:

**Available Modules:**
- `dashboard` - Admin dashboard access
- `menu` - Menu management
- `mark_attendance` - Mark attendance functionality
- `view_attendance` - View attendance records
- `guests` - Guest management
- `view_reports` - View reports and analytics
- `payments` - Payment processing
- `off_days` - Off days management
- `feedback` - Feedback management
- `send_notifications` - Send notifications
- `settings` - System settings

Each admin can have permissions enabled or disabled for each module independently.

---

## Getting Started

### Admin Login

1. Navigate to the TDLMA application URL
2. Enter your admin email and password
3. Click "Login"
4. You'll be redirected to the admin dashboard

### Dashboard Overview

The admin dashboard provides:

- **KPIs**: Key performance indicators (total users, active users, etc.)
- **Financial Overview**: Revenue, dues, payments summary
- **Operational Metrics**: Attendance statistics, meal counts
- **Feedback Summary**: Recent feedback and status
- **Quick Actions**: Fast access to common tasks
- **Charts**: Visual representation of data trends

### Navigation Guide

**Sidebar Navigation:**
- Dashboard
- Menu
- Mark Attendance
- View Attendance
- Guest Management
- View Reports
- Payments
- Off Days
- Feedback Management
- Send Notifications
- Settings

**Super Admin Additional Items:**
- Users
- Audit Logs
- Notification Settings
- Permission Management

**Header:**
- Profile menu (profile, logout)
- Notification bell
- Theme toggle

---

## System Configuration

### Settings Management

#### Accessing Settings

1. Navigate to "Settings" from the sidebar
2. View current settings and their values
3. Modify settings as needed

#### Configuring System Settings

**Close Time:**
- Default deadline for users to close their meal slots
- Format: HH:mm (e.g., 18:00 for 6:00 PM)
- Users cannot close meals after this time
- Affects "Unclosed" status calculation

**Fine Amount (Unclosed):**
- Fine amount charged when a user opens but doesn't close before deadline
- Enter amount in currency units
- Applied automatically to user dues

**Fine Amount (Unopened):**
- Fine amount charged when a user doesn't open a meal slot
- Enter amount in currency units
- Applied automatically to user dues

#### Settings History and Versioning

- All setting changes are tracked with history
- View past values and effective dates
- Settings can be changed with future effective dates
- Current active settings are marked

#### Future-Dated Settings

1. Navigate to Settings
2. Click "Set Future Value"
3. Enter the new value
4. Select the effective date
5. Save

The setting will automatically become active on the specified date.

### Off Days Management

#### Adding Off Days

1. Navigate to "Off Days" from the sidebar
2. Click "Add Off Day"
3. Select the date
4. Enter a reason/description
5. Click "Save"

**Important:**
- Off days cannot have meals opened/closed
- Off days don't count toward attendance statistics
- Users cannot mark attendance for off days

#### Editing Off Days

1. Navigate to "Off Days"
2. Find the off day in the list
3. Click "Edit"
4. Modify date or reason
5. Click "Save"

#### Viewing Off Days Calendar

1. Navigate to "Off Days"
2. View the calendar/list of all off days
3. Filter by date range if needed
4. See reason for each off day

#### Deleting Off Days

1. Navigate to "Off Days"
2. Find the off day
3. Click "Delete"
4. Confirm deletion

**Note**: Deleting an off day may affect historical attendance records.

---

## User Management (Super Admin Only)

### Creating Users

1. Navigate to "Users" from the sidebar (Super Admin only)
2. Click "Add User" or "Create User"
3. Fill in the form:
   - **Name**: User's full name
   - **Email**: Unique email address
   - **Password**: Initial password (user should change it)
   - **Role**: Select User, Admin, or Super Admin
   - **Status**: Active or Inactive
   - **Designation**: Job title or designation (optional)
   - **User Type**: Employee or Student (optional)
4. Click "Create User"
5. User will receive email verification (if email is configured)

### Editing User Information

1. Navigate to "Users"
2. Find the user in the list
3. Click "Edit" or the user's name
4. Modify information:
   - Name
   - Email (must be unique)
   - Role
   - Status
   - Designation
   - User Type
5. Click "Save Changes"

**Note**: Password changes are handled separately through the user's profile.

### Activating/Deactivating Users

1. Navigate to "Users"
2. Find the user
3. Click the status toggle or "Edit"
4. Change status:
   - **Active**: User can log in and use the system
   - **Inactive**: User cannot log in (blocked)
5. Save changes

**Important**: Inactive users cannot log in, but their data is preserved.

### Role Assignment

**Available Roles:**
- **User**: Regular user with standard access
- **Admin**: Administrator with module-based permissions
- **Super Admin**: Full system access

**To Change Role:**
1. Navigate to "Users"
2. Edit the user
3. Select new role from dropdown
4. Save changes

**Note**: Changing a user from Admin to User will remove their admin permissions.

### User Type Management

**User Types:**
- **Employee**: Regular employee
- **Student**: Student user

**To Set User Type:**
1. Edit user
2. Select user type from dropdown
3. Save

### Designation Management

1. Edit user
2. Enter or modify designation field
3. Save

Designation is displayed in user profiles and reports.

---

## Permission Management (Super Admin Only)

### Understanding Permission System

The permission system allows granular control over admin access:

- Each admin can have different module permissions
- Permissions are independent (can enable some, disable others)
- Super admins always have full access
- Permission changes are logged in audit logs

### Assigning Permissions to Admins

1. Navigate to "Permission Management" from the sidebar
2. Select an admin from the list
3. View current permissions
4. Toggle permissions for each module:
   - **Enabled**: Admin can access this module
   - **Disabled**: Admin cannot access this module
5. Click "Save Permissions"

**Modules Available:**
- Dashboard
- Menu
- Mark Attendance
- View Attendance
- Guest Management
- View Reports
- Payments
- Off Days
- Feedback Management
- Send Notifications
- Settings

### Module-Based Permissions

Each module represents a functional area:

- **Dashboard**: Access to admin dashboard
- **Menu**: Create and edit menus
- **Mark Attendance**: Record attendance for users
- **View Attendance**: View attendance records
- **Guests**: Add and manage guests
- **View Reports**: Generate reports
- **Payments**: Process payments and adjust dues
- **Off Days**: Manage holidays
- **Feedback**: View and respond to feedback
- **Send Notifications**: Send system notifications
- **Settings**: Configure system settings

### Permission Audit

- All permission changes are logged in audit logs
- View who changed permissions and when
- Track permission history for compliance

---

## Module Management

### Menu Management

#### Creating Weekly Menus

1. Navigate to "Menu" from the sidebar
2. View existing menus organized by day and week type
3. Click "Add Menu" or edit an existing menu card
4. Fill in menu details:
   - **Day of Week**: Monday through Saturday
   - **Week Type**: Even or Odd week
   - **Menu Items**: List of food items
   - **Menu Image**: Upload or select menu image
5. Click "Save"

**Week Types:**
- **Even Week**: Weeks with even numbers (2, 4, 6, etc.)
- **Odd Week**: Weeks with odd numbers (1, 3, 5, etc.)

The system automatically determines which menu to show based on the current week.

#### Editing Menu Items

1. Navigate to "Menu"
2. Click on a menu card
3. Click "Edit"
4. Modify menu items or image
5. Save changes

#### Week Type Management

Menus alternate between Even and Odd weeks:
- Week 1, 3, 5... = Odd week
- Week 2, 4, 6... = Even week

Create separate menus for each week type for the same day.

#### Menu Images

- Upload images for each menu
- Images are displayed to users on the dashboard
- Supported formats: PNG, JPG, JPEG, WEBP
- Recommended size: Optimized for web display

### Attendance Management

#### Marking Attendance

1. Navigate to "Mark Attendance" from the sidebar
2. Select date using the date picker
3. Select meal type (Breakfast, Lunch, Dinner)
4. View list of users
5. For each user:
   - Click "Present" to mark as present
   - Click "Absent" to mark as absent
   - Or use bulk actions if available
6. Changes are saved automatically

**Note**: Users can also mark their own attendance by opening/closing meal slots.

#### Viewing Attendance Records

1. Navigate to "View Attendance" from the sidebar
2. Use filters:
   - Date range
   - User (search by name/email)
   - Meal type
   - Status (Present/Absent)
3. View attendance table with:
   - User information
   - Date and meal type
   - Status
   - Fine amount (if applicable)
4. Export data if needed

#### Filtering Attendance

- **By Date**: Select specific date or date range
- **By User**: Search for specific user
- **By Meal Type**: Filter by Breakfast, Lunch, or Dinner
- **By Status**: Filter by Present or Absent

#### Guest Management

**Adding Guests:**
1. Navigate to "Guest Management" or use "Add Guest" in Mark Attendance
2. Click "Add Guest"
3. Fill in form:
   - **Inviter**: Select the user inviting the guest
   - **Guest Name**: Name of the guest
   - **Date**: Date of the meal
   - **Meal Type**: Breakfast, Lunch, or Dinner
   - **Amount**: Charge amount for the guest
4. Click "Save"

**Viewing Guests:**
1. Navigate to "Guest Management"
2. View list of all guests
3. Filter by date, inviter, or meal type
4. See guest expenses per user

**Editing Guests:**
1. Find guest in the list
2. Click "Edit"
3. Modify information
4. Save

**Deleting Guests:**
1. Find guest in the list
2. Click "Delete"
3. Confirm deletion

**Note**: Guest expenses are added to the inviter's account.

### Reports & Analytics

#### Viewing User Reports

1. Navigate to "View Reports" from the sidebar
2. Select a user from the dropdown
3. View report statistics:
   - Total opened/closed meals
   - Total unopened/unclosed meals
   - Total fine amount
   - Guest count and expenses
   - Payment summary

#### Financial Reports

1. Navigate to "View Reports"
2. View financial overview:
   - Total revenue
   - Total dues
   - Payments received
   - Reductions and waivers
   - Guest expenses

#### Attendance Statistics

1. Navigate to "View Reports"
2. View attendance metrics:
   - Total attendance records
   - Present vs Absent counts
   - Attendance trends
   - Fine calculations

#### Export Capabilities

- Reports can be exported (if feature is available)
- Export to CSV or PDF format
- Include date ranges and filters in exports

### Payment Management

#### Recording Payments

1. Navigate to "Payments" from the sidebar
2. Select a user
3. Click "Record Payment"
4. Enter:
   - **Amount**: Payment amount
   - **Description**: Optional notes
5. Click "Save"

The payment will be deducted from the user's total dues.

#### Reducing Dues

1. Navigate to "Payments"
2. Select a user
3. Click "Reduce Dues"
4. Enter:
   - **Amount**: Reduction amount
   - **Description**: Reason for reduction
5. Click "Save"

The reduction will decrease the user's total dues.

#### Waiving Amounts

1. Navigate to "Payments"
2. Select a user
3. Click "Waive Amount"
4. Enter:
   - **Amount**: Amount to waive
   - **Description**: Reason for waiver
5. Click "Save"

The waived amount will be removed from the user's dues.

#### Transaction History

1. Navigate to "Payments"
2. Select a user
3. View transaction history:
   - All payments
   - Reductions
   - Waivers
   - Dates and amounts
   - Created by (admin who processed)

### Feedback Management

#### Viewing Feedback

1. Navigate to "Feedback Management" from the sidebar
2. View all user feedback:
   - Category and type
   - Title and description
   - User information
   - Status (Pending, Reviewed, Resolved)
   - Submission date

#### Filtering Feedback

- **By Status**: Pending, Reviewed, Resolved
- **By Category**: Food, Service, App, etc.
- **By Type**: Suggestion, Complaint, Feedback
- **By User**: Search by user name/email
- **By Date**: Filter by submission date

#### Responding to Feedback

1. Navigate to "Feedback Management"
2. Click on a feedback item
3. Click "Respond" or "Add Response"
4. Enter your response
5. Update status:
   - **Pending**: Awaiting review
   - **Reviewed**: Has been reviewed
   - **Resolved**: Issue has been resolved
6. Click "Save Response"

Users will be notified when you respond to their feedback.

#### Status Management

**Status Options:**
- **Pending**: New feedback awaiting review
- **Reviewed**: Feedback has been reviewed
- **Resolved**: Feedback has been addressed

**To Change Status:**
1. Open feedback item
2. Select new status from dropdown
3. Save changes

#### Feedback Categories

Feedback can be categorized as:
- Food
- Meal Timing
- Service
- Attendance
- App
- Menu
- Environment
- Suggestion
- Other

### Notification Management

#### Sending Notifications

1. Navigate to "Send Notifications" from the sidebar
2. Click "Send Notification"
3. Fill in form:
   - **Recipient Type**: All users, Specific user, or User group
   - **Title**: Notification title
   - **Message**: Notification content
   - **Type**: Select notification type
4. Click "Send"

**Recipient Options:**
- **All Users**: Broadcast to everyone
- **Specific User**: Send to one user
- **User Group**: Send to users with specific criteria

#### Notification Preferences (Super Admin Only)

1. Navigate to "Notification Settings" from the sidebar
2. View all notification types
3. Configure for each type:
   - **Enabled**: Whether this notification type is active
   - **Send Email**: Whether to send email notifications
   - **Recipient Type**: Who receives this notification
   - **Icon**: Icon displayed for this notification
4. Save preferences

#### Notification Types

Common notification types include:
- Guest added
- Expense updated
- Feedback response
- System announcements
- Payment received
- Attendance reminders

#### Email Notifications

- Notifications can be sent via email
- Requires SMTP configuration in system settings
- Users receive email for important notifications
- Email preferences can be configured per notification type

---

## Monitoring & Maintenance

### Audit Logs (Super Admin Only)

#### Viewing Audit Logs

1. Navigate to "Audit Logs" from the sidebar
2. View all system activities:
   - User who performed action
   - Action type (CREATE_USER, UPDATE_ATTENDANCE, etc.)
   - Entity type (user, attendance, guest, etc.)
   - Entity ID
   - Timestamp
   - Additional details

#### Filtering Logs

- **By Action**: Filter by action type
- **By Entity Type**: Filter by entity (user, attendance, etc.)
- **By User**: Filter by admin who performed action
- **By Date**: Filter by date range
- **By Search**: Search in action or details

#### Understanding Log Entries

**Action Types:**
- CREATE_USER, UPDATE_USER, DELETE_USER
- CREATE_ATTENDANCE, UPDATE_ATTENDANCE
- CREATE_GUEST, UPDATE_GUEST, DELETE_GUEST
- UPDATE_SETTINGS
- CREATE_MENU, UPDATE_MENU
- CREATE_FEEDBACK, UPDATE_FEEDBACK
- And more...

**Entity Types:**
- user
- attendance
- guest
- settings
- menu
- feedback
- transaction

#### Log Retention

- Audit logs are retained indefinitely (unless configured otherwise)
- Logs cannot be deleted by admins (data integrity)
- Use logs for compliance and troubleshooting

### Dashboard Analytics

#### KPI Monitoring

The dashboard shows key performance indicators:
- Total users
- Active users
- Total attendance records
- Total revenue
- Pending feedback
- Recent activity

#### Financial Overview

- Total revenue
- Total dues
- Payments received
- Reductions and waivers
- Guest expenses
- Financial trends

#### Operational Metrics

- Attendance statistics
- Meal counts (opened/closed)
- User activity
- System usage

#### User Statistics

- User growth
- Active vs inactive users
- User types distribution
- Designation breakdown

---

## Security Guidelines

### Password Policies

**Best Practices:**
- Use strong, unique passwords
- Change passwords regularly
- Don't share passwords
- Use password managers
- Enable two-factor authentication if available

**For Admins:**
- Use complex passwords (mix of letters, numbers, symbols)
- Change default passwords immediately
- Don't reuse passwords across systems
- Report compromised accounts immediately

### Access Control Best Practices

**User Management:**
- Only create accounts for authorized users
- Deactivate accounts when users leave
- Regularly review user access
- Remove unnecessary admin accounts

**Permission Management:**
- Follow principle of least privilege
- Grant only necessary permissions
- Review permissions regularly
- Document permission changes

**Session Management:**
- Log out when finished
- Don't share admin accounts
- Use secure networks
- Clear browser cache on shared computers

### User Status Management

**Active Users:**
- Can log in and use the system
- Receive notifications
- Can submit feedback
- Can manage their meals

**Inactive Users:**
- Cannot log in
- Data is preserved
- Can be reactivated
- Use for temporary suspensions

**When to Deactivate:**
- User has left the organization
- Temporary suspension needed
- Security concerns
- Account compromise

### Data Safety and Privacy

**Data Protection:**
- All passwords are hashed (bcryptjs)
- Sensitive data is encrypted
- Database access is restricted
- Regular backups recommended

**Privacy Considerations:**
- User data is confidential
- Only authorized admins can view user information
- Audit logs track all access
- Follow data protection regulations

**Backup Recommendations:**
- Regular database backups
- Store backups securely
- Test backup restoration
- Document backup procedures

---

## Troubleshooting

### Common Admin Issues

#### Cannot Access Module

**Problem**: Admin cannot access a module they should have access to.

**Solutions:**
- Check permissions in "Permission Management" (Super Admin)
- Verify admin role (should be "admin" or "super_admin")
- Clear browser cache and cookies
- Log out and log back in
- Contact Super Admin to verify permissions

#### Users Cannot Log In

**Problem**: Users report login issues.

**Solutions:**
- Check user status (should be "Active")
- Verify email and password are correct
- Check if account is locked
- Verify email verification status
- Reset user password if needed

#### Attendance Not Recording

**Problem**: Attendance records are not saving.

**Solutions:**
- Check database connection
- Verify date is not in the future
- Check if date is an off day
- Verify user exists and is active
- Check browser console for errors

### System Errors

#### Database Connection Errors

**Problem**: Cannot connect to database.

**Solutions:**
- Verify DATABASE_URL environment variable
- Check database server status
- Verify network connectivity
- Check database credentials
- Contact database administrator

#### Email Not Sending

**Problem**: Email notifications not being sent.

**Solutions:**
- Verify SMTP configuration in environment variables
- Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- Test SMTP connection
- Check email server status
- Verify SMTP credentials are correct
- Check spam folders

#### Build Errors

**Problem**: Application build fails.

**Solutions:**
- Check Node.js version (should be 20+)
- Verify all dependencies are installed
- Check for TypeScript errors
- Review build logs
- Clear node_modules and reinstall
- Check environment variables

### Performance Optimization

#### Slow Page Loads

**Solutions:**
- Check database query performance
- Review network connectivity
- Clear browser cache
- Check server resources
- Optimize database indexes
- Review application logs

#### High Database Load

**Solutions:**
- Review query patterns
- Add database indexes
- Optimize frequent queries
- Consider caching
- Monitor database performance
- Scale database if needed

### Getting Additional Help

- Review this manual for common issues
- Check system logs for error details
- Contact system administrator
- Review audit logs for activity tracking
- Check application documentation
- Contact development team for technical issues

---

## Additional Resources

- **User Manual**: See [USER_MANUAL.md](USER_MANUAL.md) for end-user documentation
- **System Documentation**: Check README.md for technical setup
- **Support**: Contact system administrator for assistance
- **Updates**: Check system announcements for new features

---

**Last Updated**: 2025
**Version**: 1.0

