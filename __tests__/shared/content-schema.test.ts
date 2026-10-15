import {
  parseAbout,
  parseBookFrontmatter,
  parseContact,
  parsePostFrontmatter,
  parseSite,
} from "@/shared/content-schema";

describe("parseBookFrontmatter", () => {
  const valid = {
    title: "Livro",
    releaseDate: "2021-05-01",
    image: "/images/books/x.png",
  };

  it("applies defaults for optional fields", () => {
    expect(parseBookFrontmatter(valid, "x.md")).toEqual({
      ...valid,
      slogan: "",
      links: [],
      reviews: [],
    });
  });

  it("accepts a Date from unquoted YAML and normalizes it to ISO", () => {
    const parsed = parseBookFrontmatter(
      { ...valid, releaseDate: new Date("2020-01-15T00:00:00Z") },
      "x.md",
    );
    expect(parsed.releaseDate).toBe("2020-01-15");
  });

  it.each(["title", "releaseDate", "image"])(
    "names file and field when %s is missing",
    (field) => {
      const { [field]: _omitted, ...rest } = valid as Record<string, string>;
      expect(() => parseBookFrontmatter(rest, "x.md")).toThrow(
        new RegExp(
          `Invalid book \\(x\\.md\\).*missing required field: ${field}`,
        ),
      );
    },
  );

  it("rejects a release date that is not YYYY-MM-DD", () => {
    expect(() =>
      parseBookFrontmatter({ ...valid, releaseDate: "01/05/2021" }, "x.md"),
    ).toThrow(/x\.md.*releaseDate must be YYYY-MM-DD, got: 01\/05\/2021/);
  });

  it("rejects malformed links and reviews", () => {
    expect(() =>
      parseBookFrontmatter({ ...valid, links: [{ label: "A" }] }, "x.md"),
    ).toThrow(/links must be a list of \{ label, url \}/);
    expect(() =>
      parseBookFrontmatter({ ...valid, reviews: "nope" }, "x.md"),
    ).toThrow(/reviews must be a list of \{ author, text \}/);
  });

  it("keeps the primary flag on links", () => {
    const links = [{ label: "A", url: "https://a", primary: true }];
    expect(parseBookFrontmatter({ ...valid, links }, "x.md").links).toEqual(
      links,
    );
  });
});

describe("parsePostFrontmatter", () => {
  it("falls back to slug title and empty strings", () => {
    expect(parsePostFrontmatter({}, "meu-post")).toEqual({
      title: "meu-post",
      date: "",
      excerpt: "",
    });
  });

  it("includes coverImage only when present", () => {
    expect(
      parsePostFrontmatter({ title: "T", coverImage: "/c.png" }, "p")
        .coverImage,
    ).toBe("/c.png");
  });
});

describe("parseAbout / parseContact", () => {
  it("picks only the known fields", () => {
    const contact = {
      instagram: "@a",
      instagramUrl: "https://i",
      email: "a@b.c",
    };
    expect(parseContact({ ...contact, extra: "x" }, "contact.json")).toEqual(
      contact,
    );
  });

  it("names file and field for a missing or empty value", () => {
    expect(() =>
      parseAbout({ title: "t", body: "b", image: "i" }, "about.json"),
    ).toThrow(/Invalid content \(about\.json\): missing required field: body2/);
    expect(() =>
      parseAbout(
        { title: "t", body: "", body2: "b", image: "i" },
        "about.json",
      ),
    ).toThrow(/about\.json.*body\b/);
  });
});

describe("parseSite", () => {
  const site = {
    slogan: "s",
    heroWelcome: "w",
    heroPhotoAlt: "a",
    aboutPhotoAlt: "a2",
    latestReleaseTitle: "l",
    booksTitle: "bt",
    booksSubtitle: "bs",
    blogTitle: "gt",
    blogSubtitle: "gs",
    contactTitle: "ct",
    contactSubtitle: "cs",
  };

  it("picks only the known fields", () => {
    expect(parseSite({ ...site, extra: "x" }, "site.json")).toEqual(site);
  });

  it("names file and field for a missing or empty value", () => {
    const { slogan: _slogan, ...withoutSlogan } = site;
    expect(() => parseSite(withoutSlogan, "site.json")).toThrow(
      /Invalid content \(site\.json\): missing required field: slogan/,
    );
    expect(() => parseSite({ ...site, booksTitle: "" }, "site.json")).toThrow(
      /site\.json.*booksTitle/,
    );
  });
});
