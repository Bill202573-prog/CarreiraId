import { useEffect, useRef } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Invisible component that restores push subscription only when notification
 * permission was already granted. It must not trigger a browser permission
 * prompt automatically during page load.
 */
export function PushAutoSubscribe() {
  const { isSupported, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isSupported || isSubscribed || isLoading || attempted.current) return;
    attempted.current = true;

    if (Notification.permission === 'granted') {
      subscribe().catch(() => {});
    }
  }, [isSupported, isSubscribed, isLoading, subscribe]);

  return null;
}
