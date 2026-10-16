// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/renderer/src/App";
import type {
  BookEntry,
  Identity,
  OpenRepositoryResult,
  SaveBookResult,
} from "../../src/common/types";
import type { DesktopApi } from "../../src/preload";

const validBook: BookEntry = {
  slug: "livro-a",
  status: "valid",
  book: {
    slug: "livro-a",
    title: "Livro A",
    releaseDate: "2021-05-01",
    image: "/images/books/a.png",
    slogan: "",
    links: [],
    reviews: [],
    synopsis: "Sinopse A.",
  },
};

const identity: Identity = { name: "Amanda", email: "a@b.com" };

function stubApi(overrides: Partial<DesktopApi> = {}): DesktopApi {
  const api: DesktopApi = {
    openRepository: vi.fn().mockResolvedValue(null),
    listCovers: vi.fn().mockResolvedValue(["/images/books/a.png"]),
    saveBook: vi.fn(),
    getIdentity: vi.fn().mockResolvedValue(identity),
    setIdentity: vi.fn(),
    ...overrides,
  };
  window.api = api;
  return api;
}

function opened(books: BookEntry[]): OpenRepositoryResult {
  return { ok: true, books };
}

afterEach(() => {
  cleanup();
});

async function openFolder(): Promise<void> {
  await userEvent.click(
    await screen.findByRole("button", { name: /abrir pasta/i }),
  );
}

describe("App: opening the site", () => {
  it("lists valid books and flags invalid ones without hiding the rest", async () => {
    stubApi({
      openRepository: vi.fn().mockResolvedValue(
        opened([
          validBook,
          {
            slug: "ruim",
            status: "invalid",
            error: "missing required field: title",
          },
        ]),
      ),
    });
    render(<App />);

    await openFolder();

    expect(await screen.findByText("Livro A")).toBeInTheDocument();
    expect(screen.getByText("Lançamento: 01/05/2021")).toBeInTheDocument();
    expect(
      screen.getByText(/missing required field: title/),
    ).toBeInTheDocument();
  });

  it("shows the error when the folder is not the site", async () => {
    stubApi({
      openRepository: vi.fn().mockResolvedValue({
        ok: false,
        error: "Esta pasta não parece ser a pasta do site.",
      }),
    });
    render(<App />);

    await openFolder();

    expect(await screen.findByRole("alert")).toHaveTextContent("não parece");
  });

  it("keeps the screen unchanged when the picker is cancelled", async () => {
    stubApi();
    render(<App />);

    await openFolder();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Livros" }),
    ).not.toBeInTheDocument();
  });
});

describe("App: first run identity", () => {
  it("asks for name and e-mail before anything else", async () => {
    const api = stubApi({
      getIdentity: vi.fn().mockResolvedValue(null),
      setIdentity: vi.fn().mockResolvedValue({ ok: true, identity }),
    });
    render(<App />);

    await userEvent.type(await screen.findByLabelText("Nome"), "Amanda");
    await userEvent.type(screen.getByLabelText("E-mail"), "a@b.com");
    await userEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(api.setIdentity).toHaveBeenCalledWith(identity);
    expect(
      await screen.findByRole("button", { name: /abrir pasta/i }),
    ).toBeInTheDocument();
  });

  it("shows the validation message and stays on the form", async () => {
    stubApi({
      getIdentity: vi.fn().mockResolvedValue(null),
      setIdentity: vi
        .fn()
        .mockResolvedValue({ ok: false, error: "Informe um e-mail válido." }),
    });
    render(<App />);

    await userEvent.click(
      await screen.findByRole("button", { name: /continuar/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("e-mail válido");
    expect(
      screen.queryByRole("button", { name: /abrir pasta/i }),
    ).not.toBeInTheDocument();
  });
});

describe("App: editing a book", () => {
  const saved = (
    overrides: Partial<Extract<SaveBookResult, { ok: true }>> = {},
  ): SaveBookResult => ({
    ok: true,
    slug: "livro-a",
    missing: [],
    versionCreated: true,
    books: [validBook],
    ...overrides,
  });

  it("edits an existing book keeping its slug and confirms the saved version", async () => {
    const api = stubApi({
      openRepository: vi.fn().mockResolvedValue(opened([validBook])),
      saveBook: vi.fn().mockResolvedValue(saved()),
    });
    render(<App />);
    await openFolder();

    await userEvent.click(
      await screen.findByRole("button", { name: /editar livro a/i }),
    );
    const title = screen.getByLabelText("Título");
    await userEvent.clear(title);
    await userEvent.type(title, "Livro A 2");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(api.saveBook).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "livro-a",
        title: "Livro A 2",
        synopsis: "Sinopse A.",
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      /versão salva/i,
    );
  });

  it("creates a new book without a slug and shows what is missing", async () => {
    const api = stubApi({
      openRepository: vi.fn().mockResolvedValue(opened([])),
      saveBook: vi
        .fn()
        .mockResolvedValue(
          saved({ slug: "rascunho", missing: ["Capa"], books: [] }),
        ),
    });
    render(<App />);
    await openFolder();

    await userEvent.click(
      await screen.findByRole("button", { name: /novo livro/i }),
    );
    await userEvent.type(screen.getByLabelText("Título"), "Rascunho");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(api.saveBook).toHaveBeenCalledWith(
      expect.objectContaining({ slug: null, title: "Rascunho" }),
    );
    const pending = await screen.findByRole("list", { name: /o que falta/i });
    expect(within(pending).getByText("Capa")).toBeInTheDocument();
  });

  it("reuses the generated slug when a new book is saved twice", async () => {
    const api = stubApi({
      openRepository: vi.fn().mockResolvedValue(opened([])),
      saveBook: vi
        .fn()
        .mockResolvedValue(saved({ slug: "rascunho", books: [] })),
    });
    render(<App />);
    await openFolder();
    await userEvent.click(
      await screen.findByRole("button", { name: /novo livro/i }),
    );
    await userEvent.type(screen.getByLabelText("Título"), "Rascunho");

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    await screen.findByRole("status");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(api.saveBook).toHaveBeenLastCalledWith(
      expect.objectContaining({ slug: "rascunho" }),
    );
  });

  it("lets the author fix an incomplete book from the list", async () => {
    stubApi({
      openRepository: vi.fn().mockResolvedValue(
        opened([
          {
            slug: "rascunho",
            status: "invalid",
            error: "missing required field: image",
            draft: {
              slug: "rascunho",
              title: "Rascunho",
              releaseDate: "2024-01-01",
              image: "",
              slogan: "",
              links: [],
              reviews: [],
              synopsis: "",
            },
          },
        ]),
      ),
    });
    render(<App />);
    await openFolder();

    await userEvent.click(
      await screen.findByRole("button", { name: /editar rascunho/i }),
    );

    expect(screen.getByLabelText("Título")).toHaveValue("Rascunho");
    expect(
      screen.getByRole("list", { name: /o que falta/i }),
    ).toHaveTextContent("Capa");
  });

  it("shows the save error without leaving the form", async () => {
    stubApi({
      openRepository: vi.fn().mockResolvedValue(opened([])),
      saveBook: vi.fn().mockResolvedValue({
        ok: false,
        error: "Não foi possível salvar o livro.",
      }),
    });
    render(<App />);
    await openFolder();

    await userEvent.click(
      await screen.findByRole("button", { name: /novo livro/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível salvar",
    );
    expect(screen.getByLabelText("Título")).toBeInTheDocument();
  });

  it("adds and removes a purchase link", async () => {
    stubApi({ openRepository: vi.fn().mockResolvedValue(opened([])) });
    render(<App />);
    await openFolder();
    await userEvent.click(
      await screen.findByRole("button", { name: /novo livro/i }),
    );

    await userEvent.click(
      screen.getByRole("button", { name: /adicionar link de compra/i }),
    );
    expect(screen.getByLabelText("Rótulo do link 1")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /remover link de compra 1/i }),
    );
    expect(screen.queryByLabelText("Rótulo do link 1")).not.toBeInTheDocument();
  });
});
