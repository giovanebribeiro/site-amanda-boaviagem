// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/renderer/src/App";
import type { OpenRepositoryResult } from "../../src/common/types";

const validBook = {
  slug: "livro-a",
  status: "valid" as const,
  book: {
    slug: "livro-a",
    title: "Livro A",
    releaseDate: "2021-05-01",
    image: "/images/books/a.png",
    slogan: "",
    links: [],
    reviews: [],
    synopsis: "",
  },
};

function stubApi(result: OpenRepositoryResult | null): void {
  window.api = { openRepository: vi.fn().mockResolvedValue(result) };
}

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("lists valid books and flags invalid ones without hiding the rest", async () => {
    stubApi({
      ok: true,
      books: [
        validBook,
        {
          slug: "ruim",
          status: "invalid",
          error: "missing required field: title",
        },
      ],
    });
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /abrir pasta/i }));

    expect(await screen.findByText("Livro A")).toBeInTheDocument();
    expect(screen.getByText("Lançamento: 01/05/2021")).toBeInTheDocument();
    expect(
      screen.getByText(/missing required field: title/),
    ).toBeInTheDocument();
  });

  it("shows the error when the folder is not the site", async () => {
    stubApi({ ok: false, error: "Esta pasta não parece ser a pasta do site." });
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /abrir pasta/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("não parece");
  });

  it("keeps the screen unchanged when the picker is cancelled", async () => {
    stubApi(null);
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: /abrir pasta/i }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Livros" }),
    ).not.toBeInTheDocument();
  });
});
