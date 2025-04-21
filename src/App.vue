<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue';
import 'cesium/Build/CesiumUnminified/Widgets/widgets.css';
import {
  initCesium,
  createViewer,
  toggleBaseMap,
  addWyomingPolygon,
  toggleEditMode,
  getAppConfig,
  useMapState,
  usePolygonDrawingState
} from './services';

// 創建 DOM 引用
const viewerDivRef = ref<HTMLDivElement>();

// 獲取配置
const config = getAppConfig();

// 初始化 Cesium
initCesium(config);

// 使用狀態服務創建響應式狀態
const { isMapboxActive, viewer } = useMapState();
const { isEditMode, points, editingPolygon, eventHandler } = usePolygonDrawingState();

// 組件掛載時初始化 Cesium Viewer
onMounted(() => {
  if (viewerDivRef.value) {
    // 初始化 Viewer
    viewer.value = createViewer(viewerDivRef.value);
    
    // 添加懷俄明州多邊形並縮放至其位置
    const wyoming = addWyomingPolygon(viewer.value);
    viewer.value.zoomTo(wyoming);
  }
});

// 切換底圖函數
function handleToggleBaseMap() {
  if (viewer.value) {
    toggleBaseMap({
      isMapboxActive: isMapboxActive.value,
      viewer: viewer.value
    }, config.mapboxAccessToken);
    
    // 更新狀態（因為 toggleBaseMap 函數會修改傳入的物件，但不會修改 ref 的值）
    isMapboxActive.value = !isMapboxActive.value;
  }
}

// 切換編輯模式函數
function handleToggleEditMode() {
  if (viewer.value) {
    toggleEditMode(viewer.value, {
      isEditMode: isEditMode.value,
      points: points.value,
      editingPolygon: editingPolygon.value,
      eventHandler: eventHandler.value
    });
    
    // 更新狀態
    isEditMode.value = !isEditMode.value;
  }
}

// 組件卸載時清理資源
onUnmounted(() => {
  if (eventHandler.value) {
    eventHandler.value.destroy();
  }
  
  if (viewer.value) {
    viewer.value.destroy();
  }
});
</script>

<template>
  <div class="cesium-container">
    <div id="cesium-viewer" ref="viewerDivRef"></div>
    <div class="controls">
      <button @click="handleToggleBaseMap" class="toggle-button">
        {{ isMapboxActive ? '切換到 Cesium 底圖' : '切換到 Mapbox 底圖' }}
      </button>
      <button @click="handleToggleEditMode" class="toggle-button" :class="{ 'active': isEditMode }">
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