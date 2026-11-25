import type { ContactData } from "@/types";
import { DEFAULT_CONTENT_ROOT, readJsonContent } from "@/lib/json-content";
import { parseContact } from "@/shared/content-schema";

/** Reads the contact details from content/contact.json. */
export function getContactData(
  contentRoot: string = DEFAULT_CONTENT_ROOT,
): ContactData {
  return readJsonContent(contentRoot, "contact.json", parseContact);
}
