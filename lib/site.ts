import type { SiteData } from "@/types";
import { DEFAULT_CONTENT_ROOT, readJsonContent } from "@/lib/json-content";
import { parseSite } from "@/shared/content-schema";

/** Reads the general site texts (slogan, welcome, section titles, alt texts) from content/site.json. */
export function getSiteData(
  contentRoot: string = DEFAULT_CONTENT_ROOT,
): SiteData {
  return readJsonContent(contentRoot, "site.json", parseSite);
}
