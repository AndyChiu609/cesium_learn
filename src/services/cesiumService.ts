import { 
    TileMapServiceImageryProvider, 
    Viewer, 
    Ion, 
    MapboxStyleImageryProvider,
    Color,
    Entity,
    Cartesian3,
  } from 'cesium';
  import type { CesiumConfig, MapState } from '../types';;
  
  /**
   * 初始化 Cesium
   * @param config Cesium 配置對象
   */
  export function initCesium(config: CesiumConfig): void {
    window.CESIUM_BASE_URL = config.cesiumBaseUrl;
    Ion.defaultAccessToken = config.cesiumAccessToken;
  }
  
  /**
   * 創建 Cesium Viewer
   * @param container HTML元素，用於掛載 Cesium Viewer
   * @returns 創建的 Cesium Viewer 實例
   */
  export function createViewer(container: HTMLElement): Viewer {
    return new Viewer(container, {
      imageryProvider: new TileMapServiceImageryProvider({
        url: 'libs/cesium/Assets/Textures/NaturalEarthII',
      }),
      // 開啟或關閉各個 UI 元件選項
      animation: false,            // 顯示動畫控制器（時間動態播放）
      timeline: false,             // 顯示時間軸，方便時變資料控制
      fullscreenButton: false,     // 顯示全螢幕按鈕
      baseLayerPicker: false,      // 顯示底圖切換選單
      geocoder: false,             // 關閉地理編碼搜尋元件，如需搜尋可設為 true
      homeButton: false,           // 顯示回家按鈕，可快速回復至預設視角
      sceneModePicker: false,      // 顯示場景模式切換器（3D、2D、哥倫布視圖）
      navigationHelpButton: false, // 關閉導覽說明按鈕
      infoBox: false,              // 關閉資訊視窗（點選物件時的詳細資訊）
      selectionIndicator: false,   // 關閉選取指示器（點選標示）
      vrButton: false              // 關閉 VR 模式按鈕，若有 VR 裝置需求可以打開
    });
  }
  
  /**
   * 切換底圖
   * @param mapState 地圖狀態
   * @param mapboxToken Mapbox token
   */
  export function toggleBaseMap(mapState: MapState, mapboxToken: string): void {
    if (!mapState.viewer) return;
    
    // 獲取當前的影像圖層集合
    const imageryLayers = mapState.viewer.imageryLayers;
    
    // 移除所有現有的底圖圖層
    imageryLayers.removeAll();
    
    if (!mapState.isMapboxActive) {
      // 切換到 Mapbox
      const mapboxImagery = new MapboxStyleImageryProvider({
        styleId: 'streets-v11',  // 現代 Mapbox 樣式
        accessToken: mapboxToken
      });
      imageryLayers.addImageryProvider(mapboxImagery);
      mapState.isMapboxActive = true;
    } else {
      // 切換回默認的 Natural Earth II
      const defaultImagery = new TileMapServiceImageryProvider({
        url: 'libs/cesium/Assets/Textures/NaturalEarthII',
      });
      imageryLayers.addImageryProvider(defaultImagery);
      mapState.isMapboxActive = false;
    }
  }
  
  /**
   * 添加懷俄明州多邊形示例
   * @param viewer Cesium Viewer 實例
   * @returns 創建的實體
   */
  export function addWyomingPolygon(viewer: Viewer): Entity {
    const wyoming = viewer.entities.add({
      polygon: {
        hierarchy: Cartesian3.fromDegreesArray([
          -109.080842, 45.002073,
          -105.91517, 45.002073,
          -104.058488, 44.996596,
          -104.053011, 43.002989,
          -104.053011, 41.003906,
          -105.728954, 40.998429,
          -107.919731, 41.003906,
          -109.04798, 40.998429,
          -111.047063, 40.998429,
          -111.047063, 42.000709,
          -111.047063, 44.476286,
          -111.05254, 45.002073,
        ]),
        height: 0,
        material: Color.RED.withAlpha(0.5),
        outline: true,
        outlineColor: Color.BLACK,
      },
    });
    
    return wyoming;
  }