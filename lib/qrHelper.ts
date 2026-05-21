import { Platform } from 'react-native';

/**
 * Resolves the dynamic mobile-accessible URL for QR Code scanning.
 * If a custom LAN IP has been saved in localStorage, it uses that IP.
 * Otherwise, it defaults to the active window URL.
 * 
 * @param path The local path (e.g. '/collection' or '/product/2')
 */
export const getMobileQRUrl = (path: string): string => {
  if (Platform.OS !== 'web') {
    return `http://localhost:8081${path}`;
  }

  try {
    const host = window.location.host; // e.g. "localhost:8081" or "192.168.1.15:8081"
    
    // Check if there is a globally saved LAN IP override
    const savedIp = localStorage.getItem('lumora-lan-ip');
    if (savedIp) {
      // Append the port if not included in the saved IP
      const resolvedHost = savedIp.includes(':') ? savedIp : `${savedIp}:8081`;
      return `${window.location.protocol}//${resolvedHost}${path}`;
    }
    
    // Fallback/Production: Return the active window URL structure
    return `${window.location.protocol}//${host}${path}`;
  } catch (error) {
    return `http://localhost:8081${path}`;
  }
};
