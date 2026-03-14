import NetInfo from '@react-native-community/netinfo';

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return (state.isConnected === true) && (state.isInternetReachable !== false);
}

export function useNetworkStatus() {
  // Returns current connection status - use with NetInfo.addEventListener in components
  return NetInfo.fetch();
}
