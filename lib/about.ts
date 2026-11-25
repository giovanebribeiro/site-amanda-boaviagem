import type { AboutData } from "@/types";
import { DEFAULT_CONTENT_ROOT, readJsonContent } from "@/lib/json-content";
import { parseAbout } from "@/shared/content-schema";

/** Reads the author's "Sobre" section from content/about.json. */
export function getAboutData(
  contentRoot: string = DEFAULT_CONTENT_ROOT,
): AboutData {
  return readJsonContent(contentRoot, "about.json", parseAbout);
}
