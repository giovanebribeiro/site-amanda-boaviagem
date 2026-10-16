import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BrowserWindow, app, dialog, ipcMain } from "electron";
import {
  GET_IDENTITY_CHANNEL,
  IMPORT_COVER_CHANNEL,
  LIST_COVERS_CHANNEL,
  OPEN_REPOSITORY_CHANNEL,
  READ_SINGLE_CHANNEL,
  SAVE_BOOK_CHANNEL,
  SAVE_SINGLE_CHANNEL,
  SET_IDENTITY_CHANNEL,
} from "../common/channels";
import type { SingleFileKind } from "@shared/content-schema";
import type { SingleFileValues } from "../common/single-file";
import type { BookDraft, CoverTarget, Identity } from "../common/types";
import { createIdentityStore } from "./identity-store";
import { createWorkspace } from "./workspace";

const WINDOW_WIDTH = 1100;
const WINDOW_HEIGHT = 760;

async function pickFolder(window: BrowserWindow): Promise<string | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    title: "Escolha a pasta do site",
    properties: ["openDirectory"],
  });
  return canceled || filePaths.length === 0 ? null : filePaths[0];
}

const COVER_FILE_FILTER = {
  name: "Imagens",
  extensions: ["png", "jpg", "jpeg", "gif"],
};

async function pickCoverFile(window: BrowserWindow): Promise<string | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog(window, {
    title: "Escolha a imagem da capa",
    properties: ["openFile"],
    filters: [COVER_FILE_FILTER],
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
  const identityStore = createIdentityStore(app.getPath("userData"));
  const workspace = createWorkspace(identityStore);

  ipcMain.handle(OPEN_REPOSITORY_CHANNEL, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;
    return workspace.open(await pickFolder(window));
  });
  ipcMain.handle(LIST_COVERS_CHANNEL, () => workspace.covers());
  ipcMain.handle(IMPORT_COVER_CHANNEL, async (event, target: CoverTarget) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;
    const file = await pickCoverFile(window);
    if (file === null) return null;
    try {
      const bytes = await readFile(file);
      return await workspace.importCover({
        bytes,
        slug: target?.slug ?? null,
        title: target?.title ?? "",
      });
    } catch (error) {
      console.error("Failed to read cover file", error);
      return {
        ok: false,
        error: "Não foi possível ler o arquivo escolhido. Tente de novo.",
      };
    }
  });
  ipcMain.handle(SAVE_BOOK_CHANNEL, (_event, draft: BookDraft) =>
    workspace.saveBook(draft),
  );
  ipcMain.handle(READ_SINGLE_CHANNEL, (_event, kind: SingleFileKind) =>
    workspace.readSingle(kind),
  );
  ipcMain.handle(
    SAVE_SINGLE_CHANNEL,
    (_event, kind: SingleFileKind, values: SingleFileValues) =>
      workspace.saveSingle(kind, values),
  );
  ipcMain.handle(GET_IDENTITY_CHANNEL, () => identityStore.read());
  ipcMain.handle(SET_IDENTITY_CHANNEL, (_event, identity: Identity) =>
    identityStore.write(identity),
  );

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
