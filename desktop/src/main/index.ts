import { join } from "node:path";
import { BrowserWindow, app, dialog, ipcMain } from "electron";
import { OPEN_REPOSITORY_CHANNEL } from "../common/channels";
import { openRepository } from "./repository-service";

const WINDOW_WIDTH = 1100;
const WINDOW_HEIGHT = 760;

async function pickFolder(window: BrowserWindow): Promise<string | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    title: "Escolha a pasta do site",
    properties: ["openDirectory"],
  });
  return canceled || filePaths.length === 0 ? null : filePaths[0];
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (url !== window.webContents.getURL()) event.preventDefault();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void window.loadFile(join(__dirname, "../renderer/index.html"));
  }
  return window;
}

app.whenReady().then(() => {
  ipcMain.handle(OPEN_REPOSITORY_CHANNEL, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;
    return openRepository(await pickFolder(window));
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
