import fs from "fs";
import path from "path";

export const DEFAULT_CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * Reads a JSON file from the content root and validates that every required
 * field is a non-empty string. Fails with an error naming the file and field.
 */
export function readJsonContent<T extends { [K in keyof T]: string }>(
  contentRoot: string,
  fileName: string,
  requiredFields: readonly (keyof T & string)[],
): T {
  const filePath = path.join(contentRoot, fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Invalid content (${fileName}): file not found at ${filePath}`);
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Invalid content (${fileName}): not valid JSON`, {
      cause: error,
    });
  }

  for (const field of requiredFields) {
    const value = data?.[field];
    if (typeof value !== "string" || value.length === 0) {
      throw new Error(
        `Invalid content (${fileName}): missing required field: ${field}`,
      );
    }
  }

  return Object.fromEntries(
    requiredFields.map((field) => [field, data[field]]),
  ) as T;
}
