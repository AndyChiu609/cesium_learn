import type { CesiumConfig } from '../types';

/**
 * 獲取應用程式配置
 * @returns 包含所有環境變量和配置的對象
 */
export function getAppConfig(): CesiumConfig {
  // 確保環境變量存在
  const cesiumAccessToken = import.meta.env.VITE_CESIUM_ACCESS_TOKEN;
  const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  
  if (!cesiumAccessToken) {
    console.error('VITE_CESIUM_ACCESS_TOKEN not found in environment variables');
  }
  
  if (!mapboxAccessToken) {
    console.error('VITE_MAPBOX_ACCESS_TOKEN not found in environment variables');
  }
  
  return {
    cesiumAccessToken: cesiumAccessToken as string,
    mapboxAccessToken: mapboxAccessToken as string,
    cesiumBaseUrl: 'libs/cesium/'
  };
}