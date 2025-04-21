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
   * 開始編輯模式
   * @param viewer Cesium Viewer 實例
   * @param state 多邊形繪製狀態
   */
  export function startEditMode(viewer: Viewer, state: PolygonDrawingState): void {
    // 設置編輯模式為 true
    state.isEditMode = true;
    
    // 清空之前的點位
    state.points = [];
    
    // 創建一個使用 CallbackProperty 的多邊形
    // 這樣每次 points 數組變化時，多邊形會自動更新
    state.editingPolygon = viewer.entities.add({
      polygon: {
        // 使用 CallbackProperty 動態更新 hierarchy
        hierarchy: new CallbackProperty(() => {
          // 當點位數量足夠時返回多邊形，否則返回空數組
          if (state.points.length >= 2) {
            return new PolygonHierarchy(state.points);
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
    state.eventHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    
    // 監聽左鍵點擊事件，用於添加點位
    state.eventHandler.setInputAction((click: any) => {
      // 使用 pickEllipsoid 而不是 pickPosition
      const cartesian = viewer.camera.pickEllipsoid(
        click.position,
        viewer.scene.globe.ellipsoid
      );
      
      // 檢查是否獲取到有效坐標
      if (cartesian) {
        // 將點位添加到數組中，由於使用了 CallbackProperty
        // 多邊形會自動更新，不需要顯式調用更新函數
        state.points.push(cartesian);
      }
    }, ScreenSpaceEventType.LEFT_CLICK);
    
    // 監聽右鍵點擊事件，用於完成繪製
    state.eventHandler.setInputAction(() => {
      if (state.points.length >= 3) {
        // 完成多邊形繪製
        completePolygon(viewer, state);
      } else {
        // 如果點不夠，直接取消
        cancelEditMode(viewer, state);
      }
    }, ScreenSpaceEventType.RIGHT_CLICK);
  }
  
  /**
   * 完成多邊形繪製
   * @param viewer Cesium Viewer 實例
   * @param state 多邊形繪製狀態
   */
  export function completePolygon(viewer: Viewer, state: PolygonDrawingState): void {
    if (!state.editingPolygon) return;
    
    // 創建一個固定的多邊形替換編輯中的臨時多邊形
    viewer.entities.add({
      polygon: {
        hierarchy: new PolygonHierarchy(state.points),
        material: Color.BLUE.withAlpha(0.5),
        outline: true,
        outlineColor: Color.WHITE,
      }
    });
    
    // 移除臨時編輯的多邊形
    viewer.entities.remove(state.editingPolygon);
    
    // 完成後重置
    state.editingPolygon = null;
    state.points = [];
    
    // 退出編輯模式
    exitEditMode(state);
  }
  
  /**
   * 取消編輯模式
   * @param viewer Cesium Viewer 實例
   * @param state 多邊形繪製狀態
   */
  export function cancelEditMode(viewer: Viewer, state: PolygonDrawingState): void {
    // 如果有正在編輯的多邊形，移除它
    if (state.editingPolygon) {
      viewer.entities.remove(state.editingPolygon);
      state.editingPolygon = null;
    }
    
    // 清空點位
    state.points = [];
    
    // 退出編輯模式
    exitEditMode(state);
  }
  
  /**
   * 退出編輯模式
   * @param state 多邊形繪製狀態
   */
  export function exitEditMode(state: PolygonDrawingState): void {
    if (state.eventHandler) {
      state.eventHandler.destroy();
      state.eventHandler = null;
    }
    state.isEditMode = false;
  }
  
  /**
   * 切換編輯模式
   * @param viewer Cesium Viewer 實例
   * @param state 多邊形繪製狀態
   */
  export function toggleEditMode(viewer: Viewer, state: PolygonDrawingState): void {
    if (!state.isEditMode) {
      // 進入編輯模式
      startEditMode(viewer, state);
    } else {
      // 退出編輯模式
      cancelEditMode(viewer, state);
    }
  }