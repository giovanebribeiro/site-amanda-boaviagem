// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/renderer/src/App";
import type {
  BookEntry,
  PostEntry,
  SavePostResult,
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
    readSingle: vi.fn().mockResolvedValue({
      ok: true,
      values: { instagram: "@a", instagramUrl: "https://i.com/a", email: "" },
    }),
    saveSingle: vi.fn(),
    importCover: vi.fn().mockResolvedValue(null),
    listPosts: vi.fn().mockResolvedValue({ ok: true, posts: [] }),
    savePost: vi.fn(),
    importPostImage: vi.fn().mockResolvedValue(null),
    listVersions: vi.fn().mockResolvedValue({ ok: true, versions: [] }),
    restoreVersion: vi.fn(),
    siteStatus: vi.fn().mockResolvedValue({ signedIn: true }),
    signIn: vi.fn(),
    onDeviceCode: vi.fn().mockReturnValue(() => {}),
    // Never settles: the legacy "Abrir pasta" tests run while the site is still downloading.
    openSite: vi.fn().mockReturnValue(new Promise(() => {})),
    publish: vi.fn(),
    deployState: vi.fn(),
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

describe("App: single-file content", () => {
  it("edits Contato, shows what is missing and saves a local version", async () => {
    const api = stubApi({
      openRepository: vi.fn().mockResolvedValue(opened([])),
      saveSingle: vi.fn().mockResolvedValue({
        ok: true,
        missing: [],
        versionCreated: true,
      }),
    });
    render(<App />);
    await openFolder();

    await userEvent.click(
      await screen.findByRole("button", { name: "Contato" }),
    );

    expect(api.readSingle).toHaveBeenCalledWith("contact");
    const missing = await screen.findByRole("list", { name: "O que falta" });
    expect(within(missing).getByText("E-mail")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("E-mail"), "x@y.com");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(api.saveSingle).toHaveBeenCalledWith("contact", {
      instagram: "@a",
      instagramUrl: "https://i.com/a",
      email: "x@y.com",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Versão salva");
    expect(
      screen.queryByRole("list", { name: "O que falta" }),
    ).not.toBeInTheDocument();
  });

  it("shows the error when the file cannot be read", async () => {
    stubApi({
      openRepository: vi.fn().mockResolvedValue(opened([])),
      readSingle: vi.fn().mockResolvedValue({ ok: false, error: "Não deu." }),
    });
    render(<App />);
    await openFolder();

    await userEvent.click(
      await screen.findByRole("button", { name: "Sobre a autora" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Não deu.");
  });
  describe("cover import", () => {
    it("sets the imported cover on the book and passes slug and title", async () => {
      const api = stubApi({
        openRepository: vi.fn().mockResolvedValue(opened([])),
        importCover: vi.fn().mockResolvedValue({
          ok: true,
          image: "/images/books/rascunho/cover.png",
        }),
        listCovers: vi
          .fn()
          .mockResolvedValue(["/images/books/rascunho/cover.png"]),
      });
      render(<App />);
      await openFolder();
      await userEvent.click(
        await screen.findByRole("button", { name: /novo livro/i }),
      );
      await userEvent.type(screen.getByLabelText("Título"), "Rascunho");

      await userEvent.click(
        screen.getByRole("button", { name: /importar capa/i }),
      );

      expect(api.importCover).toHaveBeenCalledWith({
        slug: null,
        title: "Rascunho",
      });
      expect(await screen.findByLabelText("Capa")).toHaveValue(
        "/images/books/rascunho/cover.png",
      );
    });

    it("shows the size warning but keeps the cover", async () => {
      stubApi({
        openRepository: vi.fn().mockResolvedValue(opened([])),
        importCover: vi.fn().mockResolvedValue({
          ok: true,
          image: "/images/books/x/cover.jpg",
          warning: "A capa ainda está pesada (900 KB).",
        }),
      });
      render(<App />);
      await openFolder();
      await userEvent.click(
        await screen.findByRole("button", { name: /novo livro/i }),
      );
      await userEvent.type(screen.getByLabelText("Título"), "X");

      await userEvent.click(
        screen.getByRole("button", { name: /importar capa/i }),
      );

      expect(await screen.findByRole("status")).toHaveTextContent(/pesada/i);
      expect(screen.getByLabelText("Capa")).toHaveValue(
        "/images/books/x/cover.jpg",
      );
    });

    it("shows the error and keeps the current cover when import fails", async () => {
      stubApi({
        openRepository: vi.fn().mockResolvedValue(opened([validBook])),
        importCover: vi.fn().mockResolvedValue({
          ok: false,
          error: "Este arquivo não é uma imagem.",
        }),
      });
      render(<App />);
      await openFolder();
      await userEvent.click(
        await screen.findByRole("button", { name: /editar/i }),
      );

      await userEvent.click(
        screen.getByRole("button", { name: /importar capa/i }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(/imagem/i);
      expect(screen.getByLabelText("Capa")).toHaveValue("/images/books/a.png");
    });

    it("does nothing when the author cancels the file picker", async () => {
      stubApi({
        openRepository: vi.fn().mockResolvedValue(opened([validBook])),
      });
      render(<App />);
      await openFolder();
      await userEvent.click(
        await screen.findByRole("button", { name: /editar/i }),
      );

      await userEvent.click(
        screen.getByRole("button", { name: /importar capa/i }),
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Capa")).toHaveValue("/images/books/a.png");
    });
  });
});

describe("App: editing a post", () => {
  const validPost: PostEntry = {
    slug: "meu-post",
    status: "valid",
    post: {
      slug: "meu-post",
      title: "Meu post",
      date: "2024-01-15",
      excerpt: "Resumo.",
      inPreparation: false,
      body: "Texto do post.",
    },
  };
  const savedPost = (
    overrides: Partial<Extract<SavePostResult, { ok: true }>> = {},
  ): SavePostResult => ({
    ok: true,
    slug: "meu-post",
    missing: [],
    versionCreated: true,
    posts: [validPost],
    ...overrides,
  });

  const openWithPosts = async (
    posts: PostEntry[],
    overrides: Partial<DesktopApi> = {},
  ): Promise<DesktopApi> => {
    const api = stubApi({
      openRepository: vi.fn().mockResolvedValue(opened([])),
      listPosts: vi.fn().mockResolvedValue({ ok: true, posts }),
      ...overrides,
    });
    render(<App />);
    await openFolder();
    return api;
  };

  it("lists posts and marks the ones in preparation", async () => {
    await openWithPosts([
      validPost,
      {
        ...validPost,
        slug: "rascunho",
        post: {
          ...(validPost as Extract<PostEntry, { status: "valid" }>).post,
          slug: "rascunho",
          title: "Rascunho",
          inPreparation: true,
        },
      },
      {
        slug: "quebrado",
        status: "invalid",
        error: "inPreparation must be a boolean",
      },
    ]);

    const region = await screen.findByRole("region", { name: "Posts" });
    expect(within(region).getByText("Meu post")).toBeInTheDocument();
    expect(within(region).getByText(/em preparação/i)).toBeInTheDocument();
    expect(within(region).getByText(/must be a boolean/)).toBeInTheDocument();
  });

  it("edits a post keeping its slug and confirms the saved version", async () => {
    const api = await openWithPosts([validPost], {
      savePost: vi.fn().mockResolvedValue(savedPost()),
    });

    await userEvent.click(
      await screen.findByRole("button", { name: /editar post meu post/i }),
    );
    const title = screen.getByLabelText("Título");
    await userEvent.clear(title);
    await userEvent.type(title, "Novo título");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(api.savePost).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "meu-post",
        title: "Novo título",
        body: "Texto do post.",
        inPreparation: false,
      }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      /versão salva/i,
    );
  });

  it("creates a post in preparation and shows what is missing", async () => {
    const api = await openWithPosts([], {
      savePost: vi
        .fn()
        .mockResolvedValue(
          savedPost({ slug: "novo", missing: ["Resumo"], posts: [] }),
        ),
    });

    await userEvent.click(
      await screen.findByRole("button", { name: "Novo post" }),
    );
    await userEvent.type(screen.getByLabelText("Título"), "Novo");
    await userEvent.click(screen.getByLabelText(/em preparação/i));

    expect(screen.getByRole("list", { name: "O que falta" })).toHaveTextContent(
      "Resumo",
    );
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(api.savePost).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: null,
        title: "Novo",
        inPreparation: true,
      }),
    );
  });

  it("does not offer a field to change the slug", async () => {
    await openWithPosts([validPost]);

    await userEvent.click(
      await screen.findByRole("button", { name: /editar post meu post/i }),
    );

    expect(
      screen.queryByLabelText(/slug|endereço do post/i),
    ).not.toBeInTheDocument();
  });

  it("formats the selected text with the toolbar", async () => {
    await openWithPosts([validPost]);
    await userEvent.click(
      await screen.findByRole("button", { name: /editar post meu post/i }),
    );
    const body = screen.getByLabelText("Texto") as HTMLTextAreaElement;
    body.setSelectionRange(0, 5);

    await userEvent.click(screen.getByRole("button", { name: "Negrito" }));

    expect(body.value).toBe("**Texto** do post.");
  });

  it("shows the save error without leaving the form", async () => {
    await openWithPosts([validPost], {
      savePost: vi.fn().mockResolvedValue({
        ok: false,
        error: "Não foi possível salvar o post.",
      }),
    });
    await userEvent.click(
      await screen.findByRole("button", { name: /editar post meu post/i }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("salvar o post");
    expect(screen.getByLabelText("Título")).toBeInTheDocument();
  });

  describe("inserting an image", () => {
    const imported = {
      ok: true,
      path: "/images/blog/meu-post/image-1.png",
      markdown: "![Capa na mesa](/images/blog/meu-post/image-1.png)",
    };

    const openPost = async (overrides: Partial<DesktopApi> = {}) => {
      const api = await openWithPosts([validPost], {
        importPostImage: vi.fn().mockResolvedValue(imported),
        ...overrides,
      });
      await userEvent.click(
        await screen.findByRole("button", { name: /editar post meu post/i }),
      );
      return api;
    };

    it("sends the alt text and inserts the Markdown at the cursor", async () => {
      const api = await openPost();
      const body = screen.getByLabelText("Texto") as HTMLTextAreaElement;
      body.setSelectionRange(5, 5);

      await userEvent.click(
        screen.getByRole("button", { name: "Inserir imagem" }),
      );
      await userEvent.type(
        screen.getByLabelText("Texto alternativo"),
        "Capa na mesa",
      );
      await userEvent.click(
        screen.getByRole("button", { name: /escolher imagem/i }),
      );

      expect(api.importPostImage).toHaveBeenCalledWith({
        slug: "meu-post",
        title: "Meu post",
        alt: "Capa na mesa",
      });
      expect(await screen.findByLabelText("Texto")).toHaveValue(
        `Texto\n\n${imported.markdown}\n\n do post.`,
      );
      expect(screen.queryByLabelText("Texto alternativo")).toBeNull();
    });

    it("refuses an image without alt text and does not open the picker", async () => {
      const api = await openPost();

      await userEvent.click(
        screen.getByRole("button", { name: "Inserir imagem" }),
      );
      await userEvent.click(
        screen.getByRole("button", { name: /escolher imagem/i }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /texto alternativo/i,
      );
      expect(api.importPostImage).not.toHaveBeenCalled();
    });

    it("shows the weight warning and keeps the body when the import fails", async () => {
      await openPost({
        importPostImage: vi
          .fn()
          .mockResolvedValue({ ok: false, error: "Imagem inválida." }),
      });

      await userEvent.click(
        screen.getByRole("button", { name: "Inserir imagem" }),
      );
      await userEvent.type(screen.getByLabelText("Texto alternativo"), "x");
      await userEvent.click(
        screen.getByRole("button", { name: /escolher imagem/i }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Imagem inválida.",
      );
      expect(screen.getByLabelText("Texto")).toHaveValue("Texto do post.");
    });

    it("stays put when the author cancels the picker", async () => {
      await openPost({ importPostImage: vi.fn().mockResolvedValue(null) });

      await userEvent.click(
        screen.getByRole("button", { name: "Inserir imagem" }),
      );
      await userEvent.type(screen.getByLabelText("Texto alternativo"), "x");
      await userEvent.click(
        screen.getByRole("button", { name: /escolher imagem/i }),
      );

      expect(screen.getByLabelText("Texto")).toHaveValue("Texto do post.");
    });
  });
});

describe("App: history", () => {
  const versions = [
    {
      id: "b".repeat(40),
      date: "2026-10-15T14:30:00.000Z",
      description: 'atualizar livro "Livro A"',
    },
    {
      id: "a".repeat(40),
      date: "2026-10-14T09:00:00.000Z",
      description: "atualizar contact.json",
    },
  ];

  async function openHistory(api: DesktopApi): Promise<void> {
    vi.mocked(api.openRepository).mockResolvedValue(opened([validBook]));
    render(<App />);
    await openFolder();
    await userEvent.click(
      await screen.findByRole("button", { name: /histórico/i }),
    );
  }

  it("lists the saved versions with date and description", async () => {
    const api = stubApi({
      listVersions: vi.fn().mockResolvedValue({ ok: true, versions }),
    });

    await openHistory(api);

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(
      within(items[0]).getByText(/atualizar livro "Livro A"/),
    ).toBeTruthy();
    expect(within(items[0]).getByText(/15\/10\/2026/)).toBeTruthy();
  });

  it("says so when there are no versions yet", async () => {
    await openHistory(stubApi());

    expect(await screen.findByText(/nenhuma versão salva/i)).toBeTruthy();
  });

  it("shows the error when the history cannot be read", async () => {
    await openHistory(
      stubApi({
        listVersions: vi
          .fn()
          .mockResolvedValue({ ok: false, error: "Falhou ao abrir." }),
      }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Falhou ao abrir.",
    );
  });

  it("goes back to a version, refreshes the lists and says the site was not changed", async () => {
    const restored = {
      ...validBook,
      slug: "livro-antigo",
      book: { ...validBook.book, slug: "livro-antigo", title: "Livro Antigo" },
    } as BookEntry;
    const api = stubApi({
      listVersions: vi.fn().mockResolvedValue({ ok: true, versions }),
      restoreVersion: vi.fn().mockResolvedValue({
        ok: true,
        versionCreated: true,
        versions: [
          { ...versions[0], id: "c".repeat(40), description: "voltar" },
          ...versions,
        ],
        books: [restored],
        posts: [],
      }),
    });
    await openHistory(api);

    const buttons = await screen.findAllByRole("button", {
      name: /voltar para esta versão/i,
    });
    await userEvent.click(buttons[1]);

    expect(api.restoreVersion).toHaveBeenCalledWith("a".repeat(40));
    expect(await screen.findByRole("status")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: /fechar/i }));
    expect(await screen.findByText("Livro Antigo")).toBeTruthy();
  });

  it("shows the restore error and keeps the list", async () => {
    const api = stubApi({
      listVersions: vi.fn().mockResolvedValue({ ok: true, versions }),
      restoreVersion: vi
        .fn()
        .mockResolvedValue({ ok: false, error: "Nada foi alterado." }),
    });
    await openHistory(api);

    await userEvent.click(
      (
        await screen.findAllByRole("button", {
          name: /voltar para esta versão/i,
        })
      )[0],
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Nada foi alterado.",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});

describe("App: signing in and downloading the site", () => {
  it("opens the site on its own once signed in and says when it is offline", async () => {
    stubApi({
      openSite: vi.fn().mockResolvedValue({
        ok: true,
        update: "offline",
        books: [validBook],
      }),
    });
    render(<App />);

    expect(await screen.findByText("Livro A")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/sem internet/i);
  });

  it("warns that the site was not refreshed while there is a Rascunho", async () => {
    stubApi({
      openSite: vi.fn().mockResolvedValue({
        ok: true,
        update: "kept-draft",
        books: [validBook],
      }),
    });
    render(<App />);

    expect(await screen.findByRole("status")).toHaveTextContent(/rascunho/i);
  });

  it("stays quiet when the site is current", async () => {
    stubApi({
      openSite: vi.fn().mockResolvedValue({
        ok: true,
        update: "up-to-date",
        books: [validBook],
      }),
    });
    render(<App />);

    await screen.findByText("Livro A");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("walks through the GitHub code, then downloads the site", async () => {
    let showCode: (prompt: {
      userCode: string;
      verificationUri: string;
    }) => void = () => {};
    let finishSignIn: (result: { ok: true }) => void = () => {};
    const api = stubApi({
      siteStatus: vi.fn().mockResolvedValue({ signedIn: false }),
      onDeviceCode: vi.fn().mockImplementation((listener) => {
        showCode = listener;
        return () => {};
      }),
      signIn: vi.fn().mockReturnValue(
        new Promise((resolve) => {
          finishSignIn = resolve;
        }),
      ),
      openSite: vi.fn().mockResolvedValue({
        ok: true,
        update: "cloned",
        books: [validBook],
      }),
    });
    render(<App />);

    await userEvent.click(
      await screen.findByRole("button", { name: /entrar com o github/i }),
    );
    showCode({
      userCode: "ABCD-1234",
      verificationUri: "https://github.com/login/device",
    });

    expect(await screen.findByText("ABCD-1234")).toBeInTheDocument();
    expect(api.openSite).not.toHaveBeenCalled();

    finishSignIn({ ok: true });

    expect(await screen.findByText("Livro A")).toBeInTheDocument();
    expect(api.openSite).toHaveBeenCalledTimes(1);
  });

  it("explains a failed sign-in and lets her try again", async () => {
    stubApi({
      siteStatus: vi.fn().mockResolvedValue({ signedIn: false }),
      signIn: vi
        .fn()
        .mockResolvedValue({ ok: false, error: "Não foi possível entrar." }),
    });
    render(<App />);

    await userEvent.click(
      await screen.findByRole("button", { name: /entrar com o github/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível entrar.",
    );
    expect(
      screen.getByRole("button", { name: /entrar com o github/i }),
    ).toBeEnabled();
  });

  it("goes back to the sign-in when the saved access stopped working", async () => {
    stubApi({
      openSite: vi.fn().mockResolvedValue({
        ok: false,
        error: "Seu acesso ao GitHub não está mais valendo.",
        needsSignIn: true,
      }),
    });
    render(<App />);

    expect(
      await screen.findByRole("button", { name: /entrar com o github/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "não está mais valendo",
    );
  });

  it("offers a retry when the first download fails", async () => {
    const openSite = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        error: "Conecte-se à internet e tente de novo.",
        needsSignIn: false,
      })
      .mockResolvedValueOnce({
        ok: true,
        update: "cloned",
        books: [validBook],
      });
    stubApi({ openSite });
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("internet");
    await userEvent.click(
      screen.getByRole("button", { name: /tentar de novo/i }),
    );

    expect(await screen.findByText("Livro A")).toBeInTheDocument();
  });
});

describe("App: publishing", () => {
  const SHA = "c".repeat(40);

  async function openReady(
    overrides: Partial<DesktopApi>,
  ): Promise<DesktopApi> {
    const api = stubApi({
      openSite: vi.fn().mockResolvedValue({
        ok: true,
        update: "up-to-date",
        books: [validBook],
      }),
      ...overrides,
    });
    render(<App />);
    await screen.findByText("Livro A");
    return api;
  }

  const publish = () =>
    userEvent.click(screen.getByRole("button", { name: /^publicar$/i }));

  it("sends, then follows the build until the site is live", async () => {
    const deployState = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, state: "building" })
      .mockResolvedValue({ ok: true, state: "live" });
    const api = await openReady({
      publish: vi.fn().mockResolvedValue({ ok: true, sha: SHA, sent: true }),
      deployState,
    });

    await publish();

    expect(await screen.findByText(/construindo/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/no ar/i, {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(api.deployState).toHaveBeenCalledWith(SHA);
  });

  it("says it is sending while the versions go up", async () => {
    await openReady({
      publish: vi.fn().mockReturnValue(new Promise(() => {})),
    });

    await publish();

    expect(await screen.findByText(/enviando/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^publicar$/i })).toBeDisabled();
  });

  it("explains a failed build and that the previous site stays up", async () => {
    await openReady({
      publish: vi.fn().mockResolvedValue({ ok: true, sha: SHA, sent: true }),
      deployState: vi.fn().mockResolvedValue({ ok: true, state: "failed" }),
    });

    await publish();

    expect(await screen.findByText(/falhou/i)).toBeInTheDocument();
    expect(
      screen.getByText(/site anterior continua no ar/i),
    ).toBeInTheDocument();
  });

  it("warns when offline and lets her try again", async () => {
    const publishFn = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        error: "Sem internet: nada foi perdido.",
        needsSignIn: false,
      })
      .mockResolvedValue({ ok: true, sha: SHA, sent: true });
    await openReady({
      publish: publishFn,
      deployState: vi.fn().mockResolvedValue({ ok: true, state: "live" }),
    });

    await publish();
    expect(await screen.findByRole("alert")).toHaveTextContent("Sem internet");

    await publish();
    expect(await screen.findByText(/no ar/i)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("asks to sign in again when the access was revoked", async () => {
    await openReady({
      publish: vi.fn().mockResolvedValue({
        ok: false,
        error: "Seu acesso ao GitHub não está mais valendo. Entre de novo.",
        needsSignIn: true,
      }),
    });

    await publish();

    expect(
      await screen.findByRole("button", { name: /entrar com o github/i }),
    ).toBeInTheDocument();
  });

  it("says when there was nothing new to send", async () => {
    await openReady({
      publish: vi.fn().mockResolvedValue({ ok: true, sha: SHA, sent: false }),
    });

    await publish();

    expect(
      await screen.findByText(/nada novo para publicar/i),
    ).toBeInTheDocument();
  });
});
