# Real-Time Notifications Setup

## Overview
This system provides real-time push notifications to users without requiring page reloads. Notifications appear as toast messages in the top-right corner and are triggered by database changes.

## Architecture

### Frontend Components

1. **useRealtimeNotifications Hook** (`hooks/useRealtimeNotifications.ts`)
   - Subscribes to Supabase real-time changes on the `customer_notifications` table
   - Listens for INSERT events filtered by user ID
   - Calls callback when new notification arrives

2. **NotificationContext** (`context/NotificationContext.tsx`)
   - Global state management for toast notifications
   - Provides `addToast()` and `removeToast()` methods
   - Auto-dismisses toasts after configurable duration (default: 4 seconds)

3. **ToastNotificationContainer** (`components/ToastNotification.tsx`)
   - Renders toast notifications with smooth animations
   - Supports 4 types: success, error, warning, info
   - Positioned at top-right with slide-in animation

4. **useNotificationListener Hook** (`hooks/useNotificationListener.ts`)
   - Combines real-time listening with notification context
   - Maps database notifications to toast messages
   - Automatically displays notifications when they arrive

### Integration Points

- **App Root** (`app/_layout.tsx`): Wraps app with `NotificationProvider`
- **Tabs Layout** (`app/(tabs)/_layout.tsx`): Initializes `useNotificationListener` with current user ID

## Database Setup

### SQL Trigger (Run in Supabase SQL Editor)

```sql
-- Create function to notify all users of new product
create or replace function notify_new_product()
returns trigger as $$
begin
  insert into customer_notifications (user_id, type, title, description)
  select
    id,
    'new_product',
    'New Product Available',
    'Check out ' || new.name || ' – just added to our collection!'
  from auth.users;
  
  return new;
end;
$$ language plpgsql;

-- Create trigger on products table
create trigger product_notification_trigger
after insert on products
for each row
execute function notify_new_product();

-- Create function to notify user of order updates
create or replace function notify_order_update()
returns trigger as $$
begin
  insert into customer_notifications (user_id, type, title, description)
  values (
    new.user_id,
    'order_update',
    'Order Update',
    'Your order #' || new.order_number || ' status: ' || new.status
  );
  
  return new;
end;
$$ language plpgsql;

-- Create trigger on orders table
create trigger order_notification_trigger
after update on orders
for each row
when (old.status is distinct from new.status)
execute function notify_order_update();
```

## Usage

### Displaying Notifications

Notifications are automatically displayed when:
1. A new product is added (all users notified)
2. An order status changes (user notified)
3. Any INSERT into `customer_notifications` table

### Manual Toast Notifications

```typescript
import { useNotification } from '@/context/NotificationContext';

export function MyComponent() {
  const { addToast } = useNotification();

  const handleAction = () => {
    addToast({
      type: 'success',
      title: 'Success!',
      message: 'Your action completed successfully',
      duration: 5000, // optional, defaults to 4000ms
    });
  };

  return <Pressable onPress={handleAction}>Click me</Pressable>;
}
```

## Notification Types

- **order_update**: Order status changes (blue info toast)
- **new_product**: New product added (green success toast)
- **promotion**: Special offers (yellow warning toast)
- **system**: System messages (blue info toast)

## Features

✅ Real-time updates without page reload
✅ Smooth animations (slide-in/out)
✅ Auto-dismiss after configurable duration
✅ Manual dismiss button
✅ Multiple toasts stack vertically
✅ Type-based styling (success, error, warning, info)
✅ Accessible icons and colors

## Testing

1. Open the app on a device/emulator
2. In Supabase SQL Editor, insert a test notification:
   ```sql
   insert into customer_notifications (user_id, type, title, description)
   select id, 'new_product', 'Test Product', 'This is a test notification'
   from auth.users limit 1;
   ```
3. Toast should appear instantly in the app

## Performance Considerations

- Subscriptions are cleaned up on component unmount
- Toasts auto-dismiss to prevent memory leaks
- Real-time subscriptions use Supabase's optimized WebSocket connection
- Multiple toasts are stacked efficiently
