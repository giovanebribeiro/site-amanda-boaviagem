import { describe, expect, it, vi } from "vitest";
import { openSyncedSite } from "../../src/main/site-service";
import type { SiteSession } from "../../src/main/site-session";

const stubSession = (open: SiteSession["open"]): SiteSession => ({
  isSignedIn: () => true,
  signIn: vi.fn(),
  open,
  publish: vi.fn(),
});

describe("openSyncedSite", () => {
  it("opens the synced folder and reports how it compares to the site", async () => {
    const session = stubSession(async () => ({
      ok: true,
      path: "/clone",
      update: "offline",
    }));
    const openFolder = vi.fn(() => ({ ok: true as const, books: [] }));

    const result = await openSyncedSite(session, openFolder);

    expect(openFolder).toHaveBeenCalledWith("/clone");
    expect(result).toEqual({ ok: true, update: "offline", books: [] });
  });

  it("passes sign-in and download problems through without opening anything", async () => {
    const session = stubSession(async () => ({
      ok: false,
      error: "Entre",
      needsSignIn: true,
    }));
    const openFolder = vi.fn();

    const result = await openSyncedSite(session, openFolder);

    expect(result).toEqual({ ok: false, error: "Entre", needsSignIn: true });
    expect(openFolder).not.toHaveBeenCalled();
  });

  it("explains when the downloaded folder cannot be read", async () => {
    const session = stubSession(async () => ({
      ok: true,
      path: "/clone",
      update: "cloned",
    }));

    const result = await openSyncedSite(session, () => ({
      ok: false,
      error: "Não foi possível ler esta pasta.",
    }));

    expect(result).toEqual({
      ok: false,
      error: "Não foi possível ler esta pasta.",
      needsSignIn: false,
    });
  });
});
