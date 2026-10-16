import { contextBridge, ipcRenderer } from "electron";
import {
  GET_IDENTITY_CHANNEL,
  LIST_COVERS_CHANNEL,
  OPEN_REPOSITORY_CHANNEL,
  SAVE_BOOK_CHANNEL,
  SET_IDENTITY_CHANNEL,
} from "../common/channels";
import type {
  BookDraft,
  Identity,
  IdentityResult,
  OpenRepositoryResult,
  SaveBookResult,
} from "../common/types";

const api = {
  openRepository: (): Promise<OpenRepositoryResult | null> =>
    ipcRenderer.invoke(OPEN_REPOSITORY_CHANNEL),
  listCovers: (): Promise<string[]> => ipcRenderer.invoke(LIST_COVERS_CHANNEL),
  saveBook: (draft: BookDraft): Promise<SaveBookResult> =>
    ipcRenderer.invoke(SAVE_BOOK_CHANNEL, draft),
  getIdentity: (): Promise<Identity | null> =>
    ipcRenderer.invoke(GET_IDENTITY_CHANNEL),
  setIdentity: (identity: Identity): Promise<IdentityResult> =>
    ipcRenderer.invoke(SET_IDENTITY_CHANNEL, identity),
};

contextBridge.exposeInMainWorld("api", api);

export type DesktopApi = typeof api;
