import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Carreira ID VAPID public key — safe to expose in frontend
// TODO: Replace with your actual Carreira VAPID public key
const CARREIRA_VAPID_PUBLIC_KEY = import.meta.env.VITE_CARREIRA_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useCarreiraPushNotifications() {
  const { session } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  const getSwRegistration = async (): Promise<ServiceWorkerRegistration> => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const existing = registrations.find(r => r.active?.scriptURL?.includes('carreira-sw.js'));
    if (existing) return existing;
    return navigator.serviceWorker.register('/carreira-sw.js');
  };

  const checkExistingSubscription = async () => {
    try {
      const reg = await getSwRegistration();
      await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch {
      setIsSubscribed(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!session?.user?.id || !isSupported || !CARREIRA_VAPID_PUBLIC_KEY) return false;
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') { setIsLoading(false); return false; }

      const registration = await getSwRegistration();
      if (!registration.active) {
        await new Promise<void>((resolve) => {
          const sw = registration.installing || registration.waiting;
          if (sw) {
            sw.addEventListener('statechange', () => { if (sw.state === 'activated') resolve(); });
          } else { resolve(); }
        });
      }

      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(CARREIRA_VAPID_PUBLIC_KEY) as BufferSource,
      });

      const json = subscription.toJSON();

      const { error } = await (supabase as any)
        .from('carreira_push_subscriptions')
        .upsert({
          user_id: session.user.id,
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        }, { onConflict: 'user_id,endpoint' });

      if (error) throw error;
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Carreira push subscription error:', err);
      setIsLoading(false);
      return false;
    }
  }, [session?.user?.id, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const registration = await getSwRegistration();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await (supabase as any)
          .from('carreira_push_subscriptions')
          .delete()
          .eq('user_id', session.user.id)
          .eq('endpoint', subscription.endpoint);
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Carreira push unsubscribe error:', err);
    }
    setIsLoading(false);
  }, [session?.user?.id]);

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
