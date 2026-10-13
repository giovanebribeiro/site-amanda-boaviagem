import path from "path";
import { getContactData } from "@/lib/contact";

const FIXTURES = path.join(__dirname, "..", "fixtures");
const VALID = path.join(FIXTURES, "content");

describe("getContactData", () => {
  it("reads the contact data from content/contact.json", () => {
    expect(getContactData(VALID)).toEqual({
      instagram: "@teste",
      instagramUrl: "https://www.instagram.com/teste/",
      email: "teste@example.com",
    });
  });

  it("fails with a clear error when the file is missing", () => {
    expect(() => getContactData(path.join(FIXTURES, "nao-existe"))).toThrow(
      /contact\.json.*not found/i,
    );
  });

  it("fails with a clear error when a required field is missing", () => {
    expect(() =>
      getContactData(path.join(FIXTURES, "content-invalid-contact")),
    ).toThrow(/contact\.json.*missing required field: email/i);
  });

  it("fails with a clear error when the file is not valid JSON", () => {
    expect(() =>
      getContactData(path.join(FIXTURES, "content-malformed")),
    ).toThrow(/contact\.json.*not valid JSON/i);
  });
});
