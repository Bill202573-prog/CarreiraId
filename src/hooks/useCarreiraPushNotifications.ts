// Carreira push notifications are temporarily disabled.
// The dedicated /carreira-sw.js was causing FetchEvent errors that blocked
// the site from loading. The service worker has been turned into a
// kill-switch and no longer registers a push handler.
//
// This hook is kept as a no-op so existing UI components continue to compile.

export function useCarreiraPushNotifications() {
  return {
    isSupported: false,
    permission: 'default' as NotificationPermission,
    isSubscribed: false,
    isLoading: false,
    subscribe: async () => false,
    unsubscribe: async () => {},
  };
}
