import { useEffect, useRef } from 'react';
import { useCarreiraPushNotifications } from '@/hooks/useCarreiraPushNotifications';

/**
 * Auto-subscribes carreira users to push notifications on first visit.
 * Renders nothing — just runs the subscription logic once.
 */
export function CarreiraPushAutoSubscribe() {
  const { isSupported, permission, isSubscribed, subscribe } = useCarreiraPushNotifications();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    if (!isSupported) return;
    // Only auto-subscribe if permission already granted and not yet subscribed
    if (permission === 'granted' && !isSubscribed) {
      attempted.current = true;
      subscribe();
    }
  }, [isSupported, permission, isSubscribed, subscribe]);

  return null;
}
