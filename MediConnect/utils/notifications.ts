import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Only Import notifications if NOT in Expo Go to avoid persistent SDK 53 errors
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    console.log("⏭️ Skipping Push Notifications registration (Unsupported in Expo Go SDK 53+)");
    return null;
  }

  // Dynamic import to avoid triggering side-effects in Expo Go
  const Notifications = await import('expo-notifications');
  
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      import('react-native').then(({ Alert }) => {
        Alert.alert(
          "Notifications Disabled",
          "Please enable notifications in your phone settings to receive important appointment updates."
        );
      });
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("Push Token Generated:", token);
    } catch (e) {
        console.log("Error getting push token:", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
