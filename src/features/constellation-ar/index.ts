export type {
  CatalogStar,
  Constellation,
  CatalogData,
  DeviceOrientation,
  PermissionState,
} from './model/types';

export { getAltAz } from './lib/celestialMath';
export { projectToCanvas } from './lib/screenProjection';

export { useDeviceOrientation } from './hooks/useDeviceOrientation';
