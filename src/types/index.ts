import { 
    Viewer, 
    Entity, 
    Cartesian3, 
    ScreenSpaceEventHandler,
    PolygonHierarchy
  } from 'cesium';
  
  /**
   * 定義基礎配置接口
   * 這個接口包含應用程序操作所需的基本配置
   */
  export interface CesiumConfig {
    // Cesium Ion token，用於訪問 Cesium 的服務和數據
    cesiumAccessToken: string;
    // Mapbox token，用於使用 Mapbox 的地圖服務
    mapboxAccessToken: string;
    // Cesium 資源庫的基礎 URL
    cesiumBaseUrl: string;
  }
  
  /**
   * 定義多邊形繪製狀態接口
   * 這個接口跟踪多邊形繪製操作中的狀態數據
   */
  export interface PolygonDrawingState {
    // 是否處於編輯模式
    isEditMode: boolean;
    // 當前已收集的多邊形點位
    points: Cartesian3[];
    // 當前正在編輯的多邊形實體
    editingPolygon: Entity | null;
    // 事件處理器，用於捕捉滑鼠點擊等事件
    eventHandler: ScreenSpaceEventHandler | null;
  }
  
  /**
   * 定義地圖狀態接口
   * 這個接口跟踪地圖相關的狀態
   */
  export interface MapState {
    // 是否使用 Mapbox 底圖
    isMapboxActive: boolean;
    // Cesium Viewer 實例
    viewer: Viewer | null;
  }
  
  /**
   * 定義多邊形資料接口
   * 這個接口定義多邊形資料的結構
   */
  export interface PolygonData {
    // 多邊形ID
    id: string;
    // 多邊形的點位階層
    hierarchy: PolygonHierarchy;
    // 多邊形相關屬性，使用 Record 允許任意的鍵值對
    properties?: Record<string, any>;
  }