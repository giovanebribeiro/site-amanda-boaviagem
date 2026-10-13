import path from "path";
import { getAboutData } from "@/lib/about";

const FIXTURES = path.join(__dirname, "..", "fixtures");
const VALID = path.join(FIXTURES, "content");

describe("getAboutData", () => {
  it("reads the about data from content/about.json", () => {
    expect(getAboutData(VALID)).toEqual({
      title: "Sobre teste",
      body: "Primeiro paragrafo de teste.",
      body2: "Segundo paragrafo de teste.",
      image: "/images/teste/autora.jpeg",
    });
  });

  it("fails with a clear error when the file is missing", () => {
    expect(() => getAboutData(path.join(FIXTURES, "nao-existe"))).toThrow(
      /about\.json.*not found/i,
    );
  });

  it("fails with a clear error when a required field is missing", () => {
    expect(() =>
      getAboutData(path.join(FIXTURES, "content-invalid-about")),
    ).toThrow(/about\.json.*missing required field: body2/i);
  });

  it("fails with a clear error when the file is not valid JSON", () => {
    expect(() =>
      getAboutData(path.join(FIXTURES, "content-malformed")),
    ).toThrow(/about\.json.*not valid JSON/i);
  });
});
