/**
 * API Configuration for Wayvo Frontend
 * Supports local LAN, emulator, simulator, and production deployments
 */
import { Platform } from 'react-native';

// In Expo SDK 49+, EXPO_PUBLIC_* environment variables are automatically exposed to the client
const envApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

const getDefaultBaseUrl = (): string => {
  if (envApiUrl) {
    return envApiUrl;
  }

  // Fallback defaults:
  if (Platform.OS === 'android') {
    // Android emulator alias for host machine
    return 'http://10.0.2.2:3000/api';
  }

  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }

  // iOS simulator or physical device over local network
  // Default to the developer's detected LAN IP
  return 'http://192.168.40.76:3000/api';
};

export const API_BASE_URL = getDefaultBaseUrl();

console.log(`[Wayvo API] Configured Base URL: ${API_BASE_URL}`);
