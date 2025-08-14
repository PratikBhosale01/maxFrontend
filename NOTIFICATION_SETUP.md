# Notification System Setup

This document explains how to set up and use the real-time notification system in the Angular application.

## Features

- **Toggle Notifications**: Turn on/off real-time notifications
- **Browser Notifications**: Native browser notifications with sound
- **SSE Support**: Server-Sent Events for real-time updates
- **Notification Badge**: Shows unread notification count
- **Notification Dropdown**: View all notifications with actions
- **Multiple Notification Types**: Info, Success, Warning, Error

## Components

### 1. SSE Notification Service (`src/app/services/sse-notification.service.ts`)
- **Role-based endpoint selection**:
  - **ADMIN, APPROVEADMIN, SUPERADMIN**: All 4 endpoints
  - **APPROVEDEPOSIT**: Only `/notify/subscribe/depo`
  - **APPROVEWITHDRAW**: Only `/notify/subscribe/with`
  - **DEPOSITCHAT**: Only `/api/dchat/notifications/conversations/subscribe`
  - **WITHDRAWCHAT**: Only `/api/chat/notifications/conversations/subscribe`
- Manages browser notification permissions
- Provides notification state management
- Automatically detects user role from localStorage/sessionStorage
- Connects only to real SSE endpoints (no sample data)

### 2. Navbar Component (`src/app/home/navbar/navbar.component.ts`)
- Contains notification toggle button
- Shows notification badge with unread count
- Integrates with SSE notification service

### 3. Notification Dropdown Component (`src/app/shared/notification-dropdown/`)
- Displays list of notifications
- Allows marking notifications as read
- Provides clear all functionality

## Setup Instructions

### 1. Current Implementation (Role-Based SSE Endpoints)
The system automatically connects to endpoints based on the user's role:

**Admin Roles (ADMIN, APPROVEADMIN, SUPERADMIN):**
- All 4 endpoints: withdraw, deposit, deposit chat, and chat notifications

**Specialized Roles:**
- **APPROVEDEPOSIT**: Only deposit notifications (`/notify/subscribe/depo`)
- **APPROVEWITHDRAW**: Only withdraw notifications (`/notify/subscribe/with`)
- **DEPOSITCHAT**: Only deposit chat notifications (`/api/dchat/notifications/conversations/subscribe`)
- **WITHDRAWCHAT**: Only withdraw chat notifications (`/api/chat/notifications/conversations/subscribe`)

**Other Roles:**
- No notifications (unknown roles)

### 2. Message Format
The system expects messages in this format:
```
🔔 New Approve Withdraw Request: User ID: demoUser1, UTR: utrNumber_66ab8bcd589e, Amount: amount_56a05bede071
```

The system automatically:
- Removes the bell emoji (🔔)
- Extracts the title (before the colon)
- Extracts the message content (after the colon)
- Determines notification type based on keywords:
  - `withdraw` → warning (orange)
  - `deposit`/`depo` → info (blue)
  - `chat` → success (green)
  - `error`/`failed` → error (red)

### 3. Role Detection
The system automatically detects the user's role from localStorage/sessionStorage and connects to the appropriate endpoints. If the user role changes (e.g., after logout/login), you can call `refreshConnections()` to update the connections.

### 4. Connection Behavior
The system connects only to real SSE endpoints based on the user's role. If no endpoints are available for the current role or if connections fail, no notifications will be shown. The system logs connection status for debugging purposes.

## Usage

### For Users:
1. **Toggle Notifications**: Click the notification button in the navbar to turn on/off
2. **View Notifications**: Click the red badge to open notification dropdown
3. **Mark as Read**: Click on any notification to mark it as read
4. **Clear All**: Use the clear button in the dropdown to remove all notifications

### For Developers:
1. **Add to Components**: Import and inject `SseNotificationService`
2. **Subscribe to Notifications**: Use the service methods to get notification data
3. **Custom Actions**: Add custom logic when notifications are clicked

## Browser Permissions

The system automatically requests notification permissions when the service is initialized. Users will see a browser prompt asking for permission to show notifications.

## Styling

The notification system uses the existing golden theme (`#ffd700`) to match your application's design. All styles are responsive and work on mobile devices.

## Troubleshooting

1. **Notifications not showing**: Check browser notification permissions
2. **SSE not connecting**: Verify endpoint URLs and CORS settings
3. **Badge not updating**: Ensure the service is properly injected and subscribed to

## Future Enhancements

- Add notification sound customization
- Implement notification categories/filtering
- Add notification history persistence
- Create notification preferences settings
