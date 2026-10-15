import { contextBridge, ipcRenderer } from "electron";
import { OPEN_REPOSITORY_CHANNEL } from "../common/channels";
import type { OpenRepositoryResult } from "../common/types";

const api = {
  openRepository: (): Promise<OpenRepositoryResult | null> =>
    ipcRenderer.invoke(OPEN_REPOSITORY_CHANNEL),
};

contextBridge.exposeInMainWorld("api", api);

export type DesktopApi = typeof api;
