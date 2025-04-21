import { ref } from 'vue';
import type { Ref } from 'vue';
import type { Viewer, Entity, Cartesian3, ScreenSpaceEventHandler } from 'cesium';
import type { CesiumConfig } from '../types';

/**
 * 創建地圖狀態
 * @returns 地圖狀態的響應式引用對象
 */
export function useMapState(): {
  isMapboxActive: Ref<boolean>;
  viewer: Ref<Viewer | null>;
} {
  const isMapboxActive = ref<boolean>(false);
  const viewer = ref<Viewer | null>(null);
  
  return {
    isMapboxActive,
    viewer
  };
}

/**
 * 創建多邊形繪製狀態
 * @returns 多邊形繪製狀態的響應式引用對象
 */
export function usePolygonDrawingState(): {
  isEditMode: Ref<boolean>;
  points: Ref<Cartesian3[]>;
  editingPolygon: Ref<Entity | null>;
  eventHandler: Ref<ScreenSpaceEventHandler | null>;
} {
  const isEditMode = ref<boolean>(false);
  const points = ref<Cartesian3[]>([]);
  const editingPolygon = ref<Entity | null>(null);
  const eventHandler = ref<ScreenSpaceEventHandler | null>(null);
  
  return {
    isEditMode,
    points,
    editingPolygon,
    eventHandler
  };
}

/**
 * 創建 Cesium 配置
 * @returns Cesium 配置物件
 */
export function createCesiumConfig(): CesiumConfig {
  return {
    cesiumAccessToken: import.meta.env.VITE_CESIUM_ACCESS_TOKEN as string,
    mapboxAccessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string,
    cesiumBaseUrl: 'libs/cesium/'
  };
}