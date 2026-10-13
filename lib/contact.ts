import type { ContactData } from "@/types";
import { DEFAULT_CONTENT_ROOT, readJsonContent } from "@/lib/json-content";

const REQUIRED_FIELDS = ["instagram", "instagramUrl", "email"] as const;

/** Reads the contact details from content/contact.json. */
export function getContactData(
  contentRoot: string = DEFAULT_CONTENT_ROOT,
): ContactData {
  return readJsonContent<ContactData>(
    contentRoot,
    "contact.json",
    REQUIRED_FIELDS,
  );
}
