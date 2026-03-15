/**
 * Secure storage for tokens. Uses expo-secure-store when available (native),
 * falls back to AsyncStorage on web/emulator where SecureStore may not be available.
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const FALLBACK_PREFIX = '@secure_fallback_';

async function secureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    await SecureStore.setItemAsync('__availability_check__', '1');
    await SecureStore.deleteItemAsync('__availability_check__');
    return true;
  } catch {
    return false;
  }
}

let useSecureStore: boolean | null = null;

async function getStorage(): Promise<typeof SecureStore | 'async'> {
  if (useSecureStore === null) {
    useSecureStore = await secureStoreAvailable();
  }
  return useSecureStore ? SecureStore : 'async';
}

export async function getSecureItem(key: string): Promise<string | null> {
  const storage = await getStorage();
  if (storage === 'async') {
    return AsyncStorage.getItem(FALLBACK_PREFIX + key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  const storage = await getStorage();
  if (storage === 'async') {
    await AsyncStorage.setItem(FALLBACK_PREFIX + key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function removeSecureItem(key: string): Promise<void> {
  const storage = await getStorage();
  if (storage === 'async') {
    await AsyncStorage.removeItem(FALLBACK_PREFIX + key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
