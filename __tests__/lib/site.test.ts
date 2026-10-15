import path from "path";
import { getSiteData } from "@/lib/site";
import { siteFixture } from "../fixtures/site";

const FIXTURES = path.join(__dirname, "..", "fixtures");

describe("getSiteData", () => {
  it("reads the general site texts from content/site.json", () => {
    expect(getSiteData(path.join(FIXTURES, "content"))).toEqual(siteFixture);
  });

  it("fails with a clear error when the file is missing", () => {
    expect(() => getSiteData(path.join(FIXTURES, "nao-existe"))).toThrow(
      /site\.json.*not found/i,
    );
  });

  it("fails with a clear error when a required field is missing", () => {
    expect(() =>
      getSiteData(path.join(FIXTURES, "content-invalid-site")),
    ).toThrow(/site\.json.*missing required field: heroPhotoAlt/i);
  });

  it("fails with a clear error when the file is not valid JSON", () => {
    expect(() => getSiteData(path.join(FIXTURES, "content-malformed"))).toThrow(
      /site\.json.*not valid JSON/i,
    );
  });
});
