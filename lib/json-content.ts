import fs from "fs";
import path from "path";

export const DEFAULT_CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * Reads a JSON file from the content root and hands the parsed data to the
 * shared schema parser, which validates it and names the file and field on error.
 */
export function readJsonContent<T>(
  contentRoot: string,
  fileName: string,
  parse: (data: Record<string, unknown>, fileName: string) => T,
): T {
  const filePath = path.join(contentRoot, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Invalid content (${fileName}): file not found at ${filePath}`,
    );
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Invalid content (${fileName}): not valid JSON`, {
      cause: error,
    });
  }

  return parse(data, fileName);
}
