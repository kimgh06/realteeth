import type { PermissionState } from '../model/types';
import { useCamera } from './useCamera';
import { useDeviceOrientation } from './useDeviceOrientation';

interface UsePermissionsReturn {
  cameraPermission: PermissionState;
  orientationPermission: PermissionState;
  allGranted: boolean;
  requestAll: () => Promise<void>;
}

export function usePermissions(): UsePermissionsReturn {
  const { permission: cameraPermission, requestCamera } = useCamera();
  const { permission: orientationPermission, requestOrientation } = useDeviceOrientation();

  const allGranted = cameraPermission === 'granted' && orientationPermission === 'granted';

  const requestAll = async () => {
    await requestCamera();
    await requestOrientation();
  };

  return {
    cameraPermission,
    orientationPermission,
    allGranted,
    requestAll,
  };
}
