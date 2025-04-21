import {
  Viewer,
  Color,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  PolygonHierarchy,
  CallbackProperty
} from 'cesium';
import type { PolygonDrawingState } from '../types';

/**
 * 开始编辑模式
 * @param viewer Cesium Viewer 实例
 * @param state 多边形绘制状态
 */
export function startEditMode(viewer: Viewer, state: PolygonDrawingState): void {
  // 设置编辑模式为 true
  state.isEditMode = true;
  
  // 清空之前的点位
  state.points = [];
  
  // 创建一个使用 CallbackProperty 的多边形
  // 这样每次 points 数组变化时，多边形会自动更新
  state.editingPolygon = viewer.entities.add({
    polygon: {
      // 使用 CallbackProperty 动态更新 hierarchy
      hierarchy: new CallbackProperty(() => {
        // 当点位数量足够时返回多边形，否则返回空数组
        if (state.points.length >= 2) {
          return new PolygonHierarchy(state.points);
        } else {
          return new PolygonHierarchy([]);
        }
      }, false), // false 表示不在每帧都更新，只在需要时更新
      material: Color.YELLOW.withAlpha(0.5),
      outline: true,
      outlineColor: Color.WHITE,
    }
  });
  
  // 创建事件处理器
  state.eventHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
  
  // 监听左键点击事件，用于添加点位
  state.eventHandler.setInputAction((click: any) => {
    // 使用 pickEllipsoid 而不是 pickPosition
    const cartesian = viewer.camera.pickEllipsoid(
      click.position,
      viewer.scene.globe.ellipsoid
    );
    
    // 检查是否获取到有效坐标
    if (cartesian) {
      // 将点位添加到数组中，由于使用了 CallbackProperty
      // 多边形会自动更新，不需要显式调用更新函数
      state.points.push(cartesian);
    }
  }, ScreenSpaceEventType.LEFT_CLICK);
  
  // 监听右键点击事件，用于完成绘制
  state.eventHandler.setInputAction(() => {
    if (state.points.length >= 3) {
      // 完成多边形绘制
      completePolygon(viewer, state);
    } else {
      // 如果点不够，直接取消
      cancelEditMode(viewer, state);
    }
  }, ScreenSpaceEventType.RIGHT_CLICK);
}

/**
 * 完成多边形绘制
 * @param viewer Cesium Viewer 实例
 * @param state 多边形绘制状态
 */
export function completePolygon(viewer: Viewer, state: PolygonDrawingState): void {
  if (!state.editingPolygon) return;
  
  // 创建一个固定的多边形替换编辑中的临时多边形
  viewer.entities.add({
    polygon: {
      hierarchy: new PolygonHierarchy(state.points),
      material: Color.BLUE.withAlpha(0.5),
      outline: true,
      outlineColor: Color.WHITE,
    }
  });
  
  // 移除临时编辑的多边形
  viewer.entities.remove(state.editingPolygon);
  
  // 完成后重置
  state.editingPolygon = null;
  state.points = [];
  
  // 退出编辑模式
  exitEditMode(state);
}

/**
 * 取消编辑模式
 * @param viewer Cesium Viewer 实例
 * @param state 多边形绘制状态
 */
export function cancelEditMode(viewer: Viewer, state: PolygonDrawingState): void {
  // 如果有正在编辑的多边形，移除它
  if (state.editingPolygon) {
    viewer.entities.remove(state.editingPolygon);
    state.editingPolygon = null;
  }
  
  // 清空点位
  state.points = [];
  
  // 退出编辑模式
  exitEditMode(state);
}

/**
 * 退出编辑模式
 * @param state 多边形绘制状态
 */
export function exitEditMode(state: PolygonDrawingState): void {
  if (state.eventHandler) {
    state.eventHandler.destroy();
    state.eventHandler = null;
  }
  state.isEditMode = false;
}

/**
 * 切换编辑模式
 * @param viewer Cesium Viewer 实例
 * @param state 多边形绘制状态
 */
export function toggleEditMode(viewer: Viewer, state: PolygonDrawingState): void {
  if (!state.isEditMode) {
    // 进入编辑模式
    startEditMode(viewer, state);
  } else {
    // 退出编辑模式
    cancelEditMode(viewer, state);
  }
}