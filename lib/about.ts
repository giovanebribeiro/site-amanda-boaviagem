import type { AboutData } from "@/types";
import { DEFAULT_CONTENT_ROOT, readJsonContent } from "@/lib/json-content";

const REQUIRED_FIELDS = ["title", "body", "body2", "image"] as const;

/** Reads the author's "Sobre" section from content/about.json. */
export function getAboutData(
  contentRoot: string = DEFAULT_CONTENT_ROOT,
): AboutData {
  return readJsonContent<AboutData>(contentRoot, "about.json", REQUIRED_FIELDS);
}
