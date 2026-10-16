import { SINGLE_FILES, type SingleFileKind } from "@shared/content-schema";

export type SingleFileValues = Readonly<Record<string, string>>;

export interface FieldLabel {
  label: string;
  multiline?: boolean;
}

export const SINGLE_FILE_TITLES: Record<SingleFileKind, string> = {
  about: "Sobre a autora",
  contact: "Contato",
  site: "Textos do site",
};

/** Author-facing labels, keyed by the field names of the shared schema. */
export const FIELD_LABELS: Record<
  SingleFileKind,
  Record<string, FieldLabel>
> = {
  about: {
    title: { label: "Título" },
    body: { label: "Primeiro parágrafo", multiline: true },
    body2: { label: "Segundo parágrafo", multiline: true },
    image: { label: "Foto (caminho da imagem)" },
  },
  contact: {
    instagram: { label: "Instagram (nome)" },
    instagramUrl: { label: "Instagram (endereço)" },
    email: { label: "E-mail" },
  },
  site: {
    slogan: { label: "Slogan" },
    heroWelcome: { label: "Boas-vindas da página inicial", multiline: true },
    heroPhotoAlt: { label: "Descrição da foto da página inicial" },
    aboutPhotoAlt: { label: "Descrição da foto do Sobre" },
    latestReleaseTitle: { label: "Título do último lançamento" },
    booksTitle: { label: "Título da seção Livros" },
    booksSubtitle: { label: "Subtítulo da seção Livros", multiline: true },
    blogTitle: { label: "Título da seção Blog" },
    blogSubtitle: { label: "Subtítulo da seção Blog", multiline: true },
    contactTitle: { label: "Título da seção Contato" },
    contactSubtitle: { label: "Subtítulo da seção Contato", multiline: true },
  },
};

export const SINGLE_FILE_KINDS = Object.keys(SINGLE_FILES) as SingleFileKind[];

export function isSingleFileKind(value: unknown): value is SingleFileKind {
  return (SINGLE_FILE_KINDS as readonly unknown[]).includes(value);
}

/** Labels of required fields that are still empty, in the author's language. */
export function findMissingFields(
  kind: SingleFileKind,
  values: SingleFileValues,
): string[] {
  return SINGLE_FILES[kind].fields
    .filter((key) => !values[key]?.trim())
    .map((key) => FIELD_LABELS[kind][key]?.label ?? key);
}

export function isSingleFileValues(value: unknown): value is SingleFileValues {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

/** JSON source for a single-file content: known keys only, LF, trailing newline. */
export function serializeSingleFile(
  fields: readonly string[],
  values: SingleFileValues,
): string {
  const data = Object.fromEntries(
    fields.map((key) => [key, (values[key] ?? "").replace(/\r\n?/g, "\n")]),
  );
  return `${JSON.stringify(data, null, 2)}\n`;
}
