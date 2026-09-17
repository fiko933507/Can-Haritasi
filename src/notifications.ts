import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { authClient } from './backend';
import { registerPushDevice } from './communityApi';

const NOTIFY_FUNCTION_URL = 'https://br-dry-boat-ayf159cc-notify.compute.c-5.us-east-2.aws.neon.tech';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function enableSmartNotifications(position?: { latitude: number; longitude: number } | null) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('nearby-help', {
      name: 'Yakındaki yardım çağrıları',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180, 100, 180],
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return { enabled: false as const, reason: 'permission' as const };

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  if (!projectId) throw new Error('Bildirim proje kimliği bulunamadı.');

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await registerPushDevice({
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    latitude: position?.latitude ?? null,
    longitude: position?.longitude ?? null,
  });

  return { enabled: true as const, token };
}

export async function dispatchSmartNotifications(reportId: string) {
  try {
    const { data, error } = await authClient.token();
    if (error || !data?.token) return { sent: 0, skipped: true };
    const response = await fetch(`${NOTIFY_FUNCTION_URL}/dispatch`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${data.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reportId }),
    });
    if (!response.ok) return { sent: 0, skipped: true };
    return await response.json() as { sent: number; skipped?: boolean };
  } catch {
    // Notification delivery must never make report publishing fail.
    return { sent: 0, skipped: true };
  }
}
