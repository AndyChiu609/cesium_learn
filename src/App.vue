<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import { 
  TileMapServiceImageryProvider, 
  Viewer, 
  Ion, 
  MapboxStyleImageryProvider,
  Cartesian3,
  Color,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  PolygonHierarchy,
  Entity,
  CallbackProperty
} from 'cesium';
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css'

const viewerDivRef = ref<HTMLDivElement>();
const viewer = ref<Viewer | null>(null);
const isMapboxActive = ref(false);
const isEditMode = ref(false);
const points = ref<Cartesian3[]>([]);
const editingPolygon = ref<Entity | null>(null);
const eventHandler = ref<ScreenSpaceEventHandler | null>(null);

window.CESIUM_BASE_URL = 'libs/cesium/';
Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ACCESS_TOKEN;
const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

onMounted(() => {
  // 初始化 Cesium Viewer
  viewer.value = new Viewer(viewerDivRef.value as HTMLElement, {
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
  
  // 添加懷俄明州多邊形實體
  const wyoming = viewer.value.entities.add({
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
  
  // 將視圖縮放至懷俄明州
  viewer.value.zoomTo(wyoming);
});

// 切換底圖函數
function toggleBaseMap() {
  if (!viewer.value) return;
  
  // 獲取當前的影像圖層集合
  const imageryLayers = viewer.value.imageryLayers;
  
  // 移除所有現有的底圖圖層
  imageryLayers.removeAll();
  
  if (!isMapboxActive.value) {
    // 切換到 Mapbox
    const mapboxImagery = new MapboxStyleImageryProvider({
      styleId: 'streets-v11',  // 現代 Mapbox 樣式
      accessToken: mapboxToken
    });
    imageryLayers.addImageryProvider(mapboxImagery);
    isMapboxActive.value = true;
  } else {
    // 切換回默認的 Natural Earth II
    const defaultImagery = new TileMapServiceImageryProvider({
      url: 'libs/cesium/Assets/Textures/NaturalEarthII',
    });
    imageryLayers.addImageryProvider(defaultImagery);
    isMapboxActive.value = false;
  }
}

// 切換編輯模式
function toggleEditMode() {
  if (!viewer.value) return;
  
  if (!isEditMode.value) {
    // 進入編輯模式
    startEditMode();
  } else {
    // 退出編輯模式
    cancelEditMode();
  }
}

// 開始編輯模式
function startEditMode() {
  if (!viewer.value) return;
  
  isEditMode.value = true;
  
  // 清空之前的點位
  points.value = [];
  
  // 創建一個使用 CallbackProperty 的多邊形
  // 這樣每次 points 數組變化時，多邊形會自動更新
  editingPolygon.value = viewer.value.entities.add({
    polygon: {
      // 使用 CallbackProperty 動態更新 hierarchy
      hierarchy: new CallbackProperty(() => {
        // 當點位數量足夠時返回多邊形，否則返回空數組
        if (points.value.length >= 2) {
          return new PolygonHierarchy(points.value);
        } else {
          return new PolygonHierarchy([]);
        }
      }, false), // false 表示不在每幀都更新，只在需要時更新
      material: Color.YELLOW.withAlpha(0.5),
      outline: true,
      outlineColor: Color.WHITE,
    }
  });
  
  // 創建事件處理器
  eventHandler.value = new ScreenSpaceEventHandler(viewer.value.scene.canvas);
  
  // 監聽左鍵點擊事件，用於添加點位
  eventHandler.value.setInputAction((click: any) => {
    // 使用 pickEllipsoid 而不是 pickPosition
    const cartesian = viewer.value!.camera.pickEllipsoid(
      click.position,
      viewer.value!.scene.globe.ellipsoid
    );
    
    // 檢查是否獲取到有效坐標
    if (cartesian) {
      // 將點位添加到數組中，由於使用了 CallbackProperty
      // 多邊形會自動更新，不需要顯式調用更新函數
      points.value.push(cartesian);
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
  
  // 監聽右鍵點擊事件，用於完成繪製
  eventHandler.value.setInputAction(() => {
    if (points.value.length >= 3) {
      // 完成多邊形繪製
      completePolygon();
    } else {
      // 如果點不夠，直接取消
      cancelEditMode();
    }
  }, ScreenSpaceEventType.RIGHT_CLICK);
}

// 完成多邊形繪製
function completePolygon() {
  if (!editingPolygon.value || !viewer.value) return;
  
  // 創建一個固定的多邊形替換編輯中的臨時多邊形
  viewer.value.entities.add({
    polygon: {
      hierarchy: new PolygonHierarchy(points.value),
      material: Color.BLUE.withAlpha(0.5),
      outline: true,
      outlineColor: Color.WHITE,
    }
  });
  
  // 移除臨時編輯的多邊形
  viewer.value.entities.remove(editingPolygon.value);
  
  // 完成後重置
  editingPolygon.value = null;
  points.value = [];
  
  // 退出編輯模式
  exitEditMode();
}

// 取消編輯模式
function cancelEditMode() {
  if (!viewer.value) return;
  
  // 如果有正在編輯的多邊形，移除它
  if (editingPolygon.value) {
    viewer.value.entities.remove(editingPolygon.value);
    editingPolygon.value = null;
  }
  
  // 清空點位
  points.value = [];
  
  // 退出編輯模式
  exitEditMode();
}

// 退出編輯模式
function exitEditMode() {
  if (eventHandler.value) {
    eventHandler.value.destroy();
    eventHandler.value = null;
  }
  isEditMode.value = false;
}

// 組件卸載時清理
onUnmounted(() => {
  if (eventHandler.value) {
    eventHandler.value.destroy();
  }
});
</script>

<template>
  <div class="cesium-container">
    <div id="cesium-viewer" ref="viewerDivRef"></div>
    <div class="controls">
      <button @click="toggleBaseMap" class="toggle-button">
        {{ isMapboxActive ? '切換到 Cesium 底圖' : '切換到 Mapbox 底圖' }}
      </button>
      <button @click="toggleEditMode" class="toggle-button" :class="{ 'active': isEditMode }">
        {{ isEditMode ? '取消繪製' : '開始繪製多邊形' }}
      </button>
    </div>
    <div v-if="isEditMode" class="instruction">
      左鍵點擊：添加點位 | 右鍵點擊：完成繪製
    </div>
  </div>
</template>

<style scoped>
.cesium-container {
  position: relative;
  width: 100%;
  height: 100%;
}

#cesium-viewer {
  width: 100%;
  height: 100%;
}

.controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.toggle-button {
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.toggle-button:hover {
  background-color: rgba(255, 255, 255, 1);
}

.toggle-button.active {
  background-color: rgba(0, 120, 255, 0.8);
  color: white;
}

.instruction {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1;
}
</style>