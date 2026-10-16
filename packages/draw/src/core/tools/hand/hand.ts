// The hand tool: grab the canvas and drag the camera. A press shows the
// grabbing cursor, the move pans, the release returns to grab.

import type { Camera, EditorApi, ToolFactory, ToolState, Vec } from "../../types";
import { panBy } from "../../camera/camera";

export const createHandTool: ToolFactory = (editor: EditorApi): ToolState => {
  let downScreen: Vec | null = null;
  let startCamera: Camera | null = null;

  return {
    id: "hand",
    onEnter() {
      downScreen = null;
      startCamera = null;
      editor.setCursor("grab");
    },
    onExit() {
      editor.setCursor("default");
    },
    onPointerDown(e) {
      downScreen = e.screen;
      startCamera = editor.getCamera();
      editor.setCursor("grabbing");
    },
    onPointerMove(e) {
      if (!downScreen || !startCamera) return;
      const delta = { x: e.screen.x - downScreen.x, y: e.screen.y - downScreen.y };
      editor.setCamera(panBy(startCamera, delta));
    },
    onPointerUp() {
      downScreen = null;
      startCamera = null;
      editor.setCursor("grab");
    },
    onCancel() {
      downScreen = null;
      startCamera = null;
      editor.setCursor("grab");
    },
  };
};
