import { contextBridge, ipcRenderer } from "electron";
import {
  GET_IDENTITY_CHANNEL,
  IMPORT_COVER_CHANNEL,
  IMPORT_POST_IMAGE_CHANNEL,
  LIST_COVERS_CHANNEL,
  LIST_POSTS_CHANNEL,
  LIST_VERSIONS_CHANNEL,
  OPEN_REPOSITORY_CHANNEL,
  READ_SINGLE_CHANNEL,
  RESTORE_VERSION_CHANNEL,
  SAVE_BOOK_CHANNEL,
  SAVE_POST_CHANNEL,
  SAVE_SINGLE_CHANNEL,
  SET_IDENTITY_CHANNEL,
  SITE_DEVICE_CODE_EVENT,
  SITE_OPEN_CHANNEL,
  SITE_SIGN_IN_CHANNEL,
  SITE_STATUS_CHANNEL,
} from "../common/channels";
import type { SingleFileKind } from "@shared/content-schema";
import type { SingleFileValues } from "../common/single-file";
import type {
  BookDraft,
  CoverTarget,
  ImportCoverResult,
  ImportPostImageResult,
  PostImageInput,
  ListPostsResult,
  ListVersionsResult,
  RestoreVersionResult,
  PostDraft,
  SavePostResult,
  ReadSingleResult,
  SaveSingleResult,
  DeviceCodePrompt,
  Identity,
  IdentityResult,
  OpenSiteResult,
  SignInResult,
  OpenRepositoryResult,
  SaveBookResult,
} from "../common/types";

const api = {
  openRepository: (): Promise<OpenRepositoryResult | null> =>
    ipcRenderer.invoke(OPEN_REPOSITORY_CHANNEL),
  listCovers: (): Promise<string[]> => ipcRenderer.invoke(LIST_COVERS_CHANNEL),
  /** Opens the file picker; resolves null when the author cancels. */
  importCover: (target: CoverTarget): Promise<ImportCoverResult | null> =>
    ipcRenderer.invoke(IMPORT_COVER_CHANNEL, target),
  /** Opens the file picker; resolves null when the author cancels. */
  importPostImage: (
    input: PostImageInput,
  ): Promise<ImportPostImageResult | null> =>
    ipcRenderer.invoke(IMPORT_POST_IMAGE_CHANNEL, input),
  saveBook: (draft: BookDraft): Promise<SaveBookResult> =>
    ipcRenderer.invoke(SAVE_BOOK_CHANNEL, draft),
  listPosts: (): Promise<ListPostsResult> =>
    ipcRenderer.invoke(LIST_POSTS_CHANNEL),
  savePost: (draft: PostDraft): Promise<SavePostResult> =>
    ipcRenderer.invoke(SAVE_POST_CHANNEL, draft),
  readSingle: (kind: SingleFileKind): Promise<ReadSingleResult> =>
    ipcRenderer.invoke(READ_SINGLE_CHANNEL, kind),
  saveSingle: (
    kind: SingleFileKind,
    values: SingleFileValues,
  ): Promise<SaveSingleResult> =>
    ipcRenderer.invoke(SAVE_SINGLE_CHANNEL, kind, values),
  listVersions: (): Promise<ListVersionsResult> =>
    ipcRenderer.invoke(LIST_VERSIONS_CHANNEL),
  restoreVersion: (versionId: string): Promise<RestoreVersionResult> =>
    ipcRenderer.invoke(RESTORE_VERSION_CHANNEL, versionId),
  getIdentity: (): Promise<Identity | null> =>
    ipcRenderer.invoke(GET_IDENTITY_CHANNEL),
  setIdentity: (identity: Identity): Promise<IdentityResult> =>
    ipcRenderer.invoke(SET_IDENTITY_CHANNEL, identity),
  siteStatus: (): Promise<{ signedIn: boolean }> =>
    ipcRenderer.invoke(SITE_STATUS_CHANNEL),
  /** Resolves when the author finishes (or abandons) the GitHub sign-in; the code to type arrives via onDeviceCode. */
  signIn: (): Promise<SignInResult> => ipcRenderer.invoke(SITE_SIGN_IN_CHANNEL),
  /** Returns the unsubscribe function. */
  onDeviceCode: (
    listener: (prompt: DeviceCodePrompt) => void,
  ): (() => void) => {
    const handler = (_event: unknown, prompt: DeviceCodePrompt) =>
      listener(prompt);
    ipcRenderer.on(SITE_DEVICE_CODE_EVENT, handler);
    return () => ipcRenderer.removeListener(SITE_DEVICE_CODE_EVENT, handler);
  },
  openSite: (): Promise<OpenSiteResult> =>
    ipcRenderer.invoke(SITE_OPEN_CHANNEL),
};

contextBridge.exposeInMainWorld("api", api);

export type DesktopApi = typeof api;
