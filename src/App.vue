<script setup lang="ts">
import { onMounted, ref, onUnmounted, watch } from 'vue';
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
import { ScreenSpaceEventHandler, ScreenSpaceEventType } from 'cesium';

// 创建 DOM 引用
const viewerDivRef = ref<HTMLDivElement>();

// 获取配置
const config = getAppConfig();

// 初始化 Cesium
initCesium(config);

// 使用状态服务创建响应式状态
const { isMapboxActive, viewer } = useMapState();
const { isEditMode, points, editingPolygon, eventHandler } = usePolygonDrawingState();

// 组件挂载时初始化 Cesium Viewer
onMounted(() => {
  if (viewerDivRef.value) {
    // 初始化 Viewer
    viewer.value = createViewer(viewerDivRef.value);
    
    // 添加怀俄明州多边形并缩放至其位置
    const wyoming = addWyomingPolygon(viewer.value);
    viewer.value.zoomTo(wyoming);
    
    // 添加全局右键事件监听
    const handler = new ScreenSpaceEventHandler(viewer.value.scene.canvas);
    handler.setInputAction(() => {
      // 当在编辑模式下检测到右键点击时，设置 isEditMode 为 false
      if (isEditMode.value === true) {
        setTimeout(() => {
          isEditMode.value = false;
        }, 100); // 使用小延迟确保原始事件处理后执行
      }
    }, ScreenSpaceEventType.RIGHT_CLICK);
  }
});

// 切换底图函数
function handleToggleBaseMap() {
  if (viewer.value) {
    toggleBaseMap({
      isMapboxActive: isMapboxActive.value,
      viewer: viewer.value
    }, config.mapboxAccessToken);
    
    // 更新状态（因为 toggleBaseMap 函数会修改传入的对象，但不会修改 ref 的值）
    isMapboxActive.value = !isMapboxActive.value;
  }
}

// 切换编辑模式函数
function handleToggleEditMode() {
  if (viewer.value) {
    toggleEditMode(viewer.value, {
      isEditMode: isEditMode.value,
      points: points.value,
      editingPolygon: editingPolygon.value,
      eventHandler: eventHandler.value
    });
    
    // 更新状态
    isEditMode.value = !isEditMode.value;
  }
}

// 组件卸载时清理资源
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
        {{ isMapboxActive ? '切换到 Cesium 底图' : '切换到 Mapbox 底图' }}
      </button>
      <button @click="handleToggleEditMode" class="toggle-button" :class="{ 'active': isEditMode }">
        {{ isEditMode ? '取消繪製' : '開始繪製多邊形' }}
      </button>
    </div>
    <div v-if="isEditMode" class="instruction">
      左键：添加點位 | 右键：完成繪製
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