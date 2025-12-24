# TDLMA User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Module-by-Module Guide](#module-by-module-guide)
5. [Common Workflows](#common-workflows)
6. [Error Handling & FAQs](#error-handling--faqs)
7. [Best Practices](#best-practices)

---

## Introduction

### What is TDLMA?

TDLMA (Tensai Devs Lunch Management App) is a comprehensive web-based system designed to help you manage your lunch bookings, track attendance, view menus, submit feedback, and monitor your payments. The system provides an intuitive interface for managing your meal preferences and staying informed about your lunch schedule.

### Purpose and Benefits

- **Easy Meal Management**: Open or close your meal slots with a single click
- **Menu Visibility**: View today's menu and weekly meal plans
- **Attendance Tracking**: Monitor your attendance history and statistics
- **Financial Transparency**: Track your payments, dues, and guest expenses
- **Feedback System**: Submit suggestions, complaints, or feedback easily
- **Real-time Notifications**: Stay updated with important announcements

### User Roles Overview

- **User**: Regular users can manage their own meals, view menus, submit feedback, and track their payments
- **Admin**: Administrators have additional permissions to manage attendance, menus, and payments for all users
- **Super Admin**: Super administrators have full system access including user management and system configuration

---

## Getting Started

### Accessing the System

1. Open your web browser and navigate to the TDLMA application URL
2. You will be directed to the login page if you're not already logged in

### Login Process

1. Enter your email address in the "Email" field
2. Enter your password in the "Password" field
3. Click the eye icon to show/hide your password if needed
4. Click the "Login" button
5. You will be redirected to your dashboard based on your role

### Password Reset

If you've forgotten your password:

1. Click "Forgot Password?" link on the login page
2. Enter your email address
3. Check your email for a password reset link
4. Click the link (valid for 1 hour)
5. Enter your new password
6. Confirm your new password
7. Click "Reset Password"

**Note**: If you don't receive the email, check your spam folder or contact your administrator.

### Email Verification

After creating an account, you may need to verify your email:

1. Check your email for a verification link
2. Click the link (valid for 24 hours)
3. Your email will be verified automatically

**Note**: You can still use the system without email verification, but some features may be limited.

### First-Time User Guide

1. **Login**: Use the credentials provided by your administrator
2. **Explore Dashboard**: Familiarize yourself with the dashboard layout
3. **View Today's Menu**: Check what's available for today
4. **Set Preferences**: Open or close meal slots as needed
5. **Update Profile**: Complete your profile information

---

## Dashboard Overview

### Navigation Structure

The user dashboard includes:

- **Header**: User profile, notifications, theme toggle, and logout
- **Sidebar Navigation**: Quick access to main sections
- **Main Content Area**: Dashboard widgets and attendance calendar
- **Statistics Cards**: Overview of your attendance and financial status

### Dashboard Components

#### Today's Menu Card
- Displays the menu for the current day
- Shows meal image and items
- Updates automatically based on the day of the week

#### Statistics Overview
- **Total Days**: Total number of days in the selected period
- **Off Days**: Number of holidays/off days
- **Work Days**: Number of working days
- **Open**: Number of meals you've opened
- **Close**: Number of meals you've closed
- **Unopened**: Meals you didn't open (may incur fines)
- **Unclosed**: Meals you didn't close before the deadline (may incur fines)
- **Total Fine**: Total fine amount for the period
- **Guests**: Number of guests you've invited
- **Guest Expense**: Total expense for guests

#### Attendance Calendar
- Interactive table showing your attendance for the selected period
- Color-coded status indicators
- Quick actions to open/close meals
- Menu preview for each day

### Filtering Options

You can filter your dashboard view by:

- **This Week**: Current week's data
- **Last Week**: Previous week's data
- **This Month**: Current month's data
- **Last Month**: Previous month's data
- **Custom Range**: Select a specific date range

---

## Module-by-Module Guide

### My Dashboard

#### Viewing Attendance Calendar

1. Navigate to "Dashboard" from the sidebar
2. The attendance calendar displays automatically
3. Use the filter dropdown to change the time period
4. Scroll through the table to view different dates

#### Understanding the Calendar

Each row in the calendar shows:

- **Date**: The date of the meal
- **Day Label**: Day of the week and week type (Even/Odd)
- **Menu**: Menu name and image for that day
- **Status**: Current status (Open, Close, or -)
- **Action**: Button to open or close the meal
- **Remark**: Final status (Open, Close, Unopened, Unclosed)

#### Opening/Closing Meal Slots

**To Open a Meal:**
1. Find the date in the attendance calendar
2. Click the "Open" button (if the meal is currently closed)
3. The status will update to "Open"
4. You can change your mind and close it before the deadline

**To Close a Meal:**
1. Find the date in the attendance calendar
2. Click the "Close" button (if the meal is currently open)
3. The status will update to "Close"
4. You cannot reopen after closing

**Important Notes:**
- You can only open/close meals for future dates or today
- There's a deadline (usually 6:00 PM) to close meals - check system settings
- If you don't close an open meal by the deadline, it becomes "Unclosed" and may incur a fine
- If you don't open a meal, it becomes "Unopened" and may incur a fine

#### Understanding Remarks

- **Open**: You opened the meal and it remained open
- **Close**: You closed the meal before the deadline
- **Unopened**: You didn't open the meal (may incur fine)
- **Unclosed**: You opened but didn't close before deadline (may incur fine)

#### Viewing Today's Menu

1. The "Today's Menu" card appears at the top of the dashboard
2. It automatically shows the menu for the current day
3. The menu updates based on the day of the week and week type (Even/Odd)

#### Statistics Overview

1. Statistics cards appear below the menu card
2. They show aggregated data for the selected filter period
3. Click on different filter options to see statistics for different periods
4. Statistics update automatically when you change filters

### My Profile

#### Viewing Profile Information

1. Click on your profile icon in the header
2. Select "Profile" from the dropdown menu
3. Your profile information is displayed including:
   - Name
   - Email
   - Designation
   - User Type (Employee/Student)
   - Account Status
   - Email Verification Status

#### Updating Profile

1. Navigate to "Profile" from the sidebar or header menu
2. Click the "Edit" button
3. Update your information:
   - Name
   - Designation
   - User Type (if applicable)
4. Click "Save Changes"
5. Your profile will be updated

**Note**: Email and role cannot be changed by users. Contact an administrator for these changes.

#### Changing Password

1. Navigate to "Profile"
2. Click "Change Password" button
3. Enter your current password
4. Enter your new password
5. Confirm your new password
6. Click "Update Password"

**Password Requirements:**
- Minimum length requirements (check with administrator)
- Use a strong, unique password
- Don't share your password with anyone

### My Feedback

#### Submitting Feedback

1. Navigate to "Submit Feedback" from the sidebar or dashboard
2. Fill out the feedback form:
   - **Category**: Select from Food, Meal Timing, Service, Attendance, App, Menu, Environment, Suggestion, or Other
   - **Type**: Choose Suggestion, Complaint, or Feedback
   - **Title**: Enter a brief title
   - **Description**: Provide detailed description
3. Click "Submit Feedback"
4. You'll receive a confirmation message

#### Viewing Feedback History

1. Navigate to "My Feedback" from the sidebar
2. View all your submitted feedback
3. Each entry shows:
   - Category and type
   - Title and description
   - Status (Pending, Reviewed, Resolved)
   - Admin response (if available)
   - Submission date

#### Feedback Status Tracking

- **Pending**: Your feedback is awaiting admin review
- **Reviewed**: Admin has reviewed your feedback
- **Resolved**: Your feedback has been addressed

You can view admin responses in the feedback details.

### My Transactions

#### Viewing Payment History

1. Navigate to "Transactions" from the sidebar
2. View all your financial transactions
3. Each transaction shows:
   - Date
   - Type (Paid, Reduced, Waived)
   - Amount
   - Description
   - Created by (admin who processed it)

#### Understanding Dues

- **Total Dues**: Your current outstanding balance
- **Paid**: Amounts you've paid
- **Reduced**: Amounts reduced by admin
- **Waived**: Amounts waived by admin

#### Transaction Types

- **Paid**: Payments you've made
- **Reduced**: Admin reduced your dues amount
- **Waived**: Admin waived (forgave) your dues amount

### Notifications

#### Viewing Notifications

1. Click the notification bell icon in the header
2. View all your notifications
3. Navigate to "Notifications" from the sidebar for full list
4. Notifications show:
   - Type and icon
   - Title and message
   - Timestamp
   - Read/Unread status

#### Notification Types

- **Guest Added**: Notification when you add a guest
- **Expense Updated**: Notification about payment/dues changes
- **Feedback Response**: Admin response to your feedback
- **System Announcements**: Important system-wide messages

#### Marking as Read

1. Click on a notification to mark it as read
2. Click "Mark All as Read" to mark all notifications as read
3. Read notifications are visually distinguished from unread ones

---

## Common Workflows

### Daily Meal Management Workflow

1. **Morning**: Check today's menu on the dashboard
2. **Before Deadline**: Decide if you want lunch today
3. **Open/Close**: Click "Open" if you want lunch, or "Close" if you don't
4. **Change Mind**: You can toggle between open/close before the deadline
5. **After Deadline**: Your choice is locked and cannot be changed

### Weekly Attendance Planning

1. **Start of Week**: Review the week's menu schedule
2. **Plan Ahead**: Open or close meals for the entire week
3. **Monitor**: Keep track of your open/close status
4. **Adjust**: Make changes before the daily deadline
5. **Review**: Check your statistics at the end of the week

### Submitting Feedback

1. **Identify Issue**: Note any concerns or suggestions
2. **Navigate**: Go to "Submit Feedback"
3. **Fill Form**: Complete all required fields
4. **Submit**: Send your feedback
5. **Track**: Monitor status in "My Feedback"
6. **Follow Up**: Check for admin responses

### Viewing Financial Summary

1. **Navigate**: Go to "Transactions"
2. **Review**: Check all payment transactions
3. **Understand**: Review dues, paid amounts, and adjustments
4. **Contact Admin**: If you have questions about your balance

---

## Error Handling & FAQs

### Common Issues and Solutions

#### "Cannot open/close" Error

**Problem**: You cannot toggle a meal's open/close status.

**Solutions**:
- Check if the date is in the past (you can only modify future dates or today)
- Verify if the deadline has passed (check system settings for close time)
- Ensure you're logged in with the correct account
- Refresh the page and try again
- Contact administrator if the issue persists

#### "Page Not Found" or "Access Denied"

**Problem**: You cannot access certain pages.

**Solutions**:
- Ensure you're logged in
- Check if you have the correct user role
- Try logging out and logging back in
- Clear browser cache and cookies
- Contact administrator if you believe you should have access

#### Payment/Dues Questions

**Problem**: You have questions about your dues or payments.

**Solutions**:
- Check "Transactions" page for payment history
- Review your dashboard statistics
- Contact your administrator for clarification
- Check if there are any pending transactions

#### Account Access Issues

**Problem**: Cannot log in or account is locked.

**Solutions**:
- Use "Forgot Password" to reset your password
- Check if your account is active (contact administrator)
- Verify you're using the correct email address
- Clear browser cache and try again
- Contact administrator if issues persist

#### Email Not Received

**Problem**: Not receiving password reset or verification emails.

**Solutions**:
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes and check again
- Try requesting again (reset links expire after 1 hour)
- Contact administrator if email service is down

### Frequently Asked Questions

**Q: Can I change my meal choice after the deadline?**
A: No, once the deadline passes, your choice is locked. This ensures accurate meal planning.

**Q: What happens if I don't open or close a meal?**
A: If you don't open a meal, it becomes "Unopened" and may incur a fine. If you open but don't close before the deadline, it becomes "Unclosed" and may incur a fine.

**Q: How do I add a guest?**
A: Guest management is handled by administrators. Contact your admin to add a guest for a specific meal.

**Q: Can I see other users' attendance?**
A: No, you can only view your own attendance and statistics.

**Q: How often are menus updated?**
A: Menus are managed by administrators and follow a weekly schedule (Even/Odd weeks).

**Q: What should I do if I see incorrect information?**
A: Contact your administrator immediately. They can correct attendance records, payments, and other information.

**Q: Can I delete my feedback?**
A: No, but you can submit additional feedback to clarify or update your previous submission.

**Q: How do I know if my feedback was reviewed?**
A: Check the status in "My Feedback". It will show "Reviewed" or "Resolved" when an admin has addressed it.

---

## Best Practices

### When to Open/Close Meals

- **Open Early**: If you're certain you want lunch, open the meal slot early in the day
- **Close Promptly**: If you know you won't have lunch, close the slot to help with meal planning
- **Check Deadline**: Always be aware of the closing deadline (usually 6:00 PM)
- **Plan Ahead**: Review the week's menu and plan your meals in advance

### Understanding Off-Days

- Off-days are holidays or days when meals are not served
- These are marked in the calendar and cannot be opened/closed
- Off-days don't count toward your attendance statistics
- Check the calendar regularly for upcoming off-days

### Guest Management Tips

- Contact your administrator well in advance to add guests
- Provide guest details (name, date, meal type)
- Be aware that guest expenses are added to your account
- Review guest expenses in your transaction history

### Notification Management

- Check notifications regularly for important updates
- Mark notifications as read to keep your inbox clean
- Pay attention to system announcements
- Review feedback responses promptly

### Security Best Practices

- Use a strong, unique password
- Never share your login credentials
- Log out when using shared computers
- Report suspicious activity to administrators
- Keep your email address updated for password resets

### Getting Help

- Check this manual first for common questions
- Review the FAQs section
- Contact your administrator for account issues
- Submit feedback through the system for feature requests or bugs

---

## Additional Resources

- For technical support, contact your system administrator
- For feature requests or feedback, use the feedback system
- Check system announcements for updates and important information

---

**Last Updated**: 2025
**Version**: 1.0

