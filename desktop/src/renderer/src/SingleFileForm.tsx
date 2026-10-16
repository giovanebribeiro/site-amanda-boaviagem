import { useEffect, useState } from "react";
import type { SingleFileKind } from "@shared/content-schema";
import {
  FIELD_LABELS,
  SINGLE_FILE_TITLES,
  findMissingFields,
  type SingleFileValues,
} from "../../common/single-file";

interface Props {
  kind: SingleFileKind;
  onClose: () => void;
}

const FIELD = "mt-1 w-full rounded border border-gray-300 p-2";
const LOAD_FAILED = "Algo deu errado ao abrir. Tente de novo.";
const SAVE_FAILED = "Algo deu errado ao salvar. Tente de novo.";

export function SingleFileForm({ kind, onClose }: Props) {
  const [values, setValues] = useState<SingleFileValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    window.api
      .readSingle(kind)
      .then((read) => {
        if (!active) return;
        if (read.ok && !read.error) {
          setValues(read.values);
        } else {
          // an unreadable file stays unloaded so Salvar cannot overwrite it with blanks
          setError(read.error ?? LOAD_FAILED);
        }
      })
      .catch((failure: unknown) => {
        console.error("readSingle failed", failure);
        if (active) setError(LOAD_FAILED);
      });
    return () => {
      active = false;
    };
  }, [kind]);

  const handleSave = async (): Promise<void> => {
    if (values === null) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await window.api.saveSingle(kind, values);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      setNotice(
        saved.versionCreated
          ? "Versão salva neste computador. O site ainda não foi atualizado."
          : "Nada mudou desde a última versão salva.",
      );
    } catch (failure) {
      console.error("saveSingle failed", failure);
      setError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const missing = values === null ? [] : findMissingFields(kind, values);

  return (
    <section aria-label={SINGLE_FILE_TITLES[kind]} className="space-y-4">
      <h2 className="text-xl font-semibold">{SINGLE_FILE_TITLES[kind]}</h2>
      {values !== null &&
        Object.entries(FIELD_LABELS[kind]).map(
          ([key, { label, multiline }]) => (
            <label key={key} className="block">
              {label}
              {multiline ? (
                <textarea
                  rows={4}
                  className={FIELD}
                  value={values[key] ?? ""}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                />
              ) : (
                <input
                  className={FIELD}
                  value={values[key] ?? ""}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                />
              )}
            </label>
          ),
        )}
      {missing.length > 0 && (
        <div className="rounded border border-amber-400 bg-amber-50 p-3">
          <p>Você pode salvar assim, mas ainda falta para publicar:</p>
          <ul aria-label="O que falta" className="list-disc pl-5">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving || values === null}
          onClick={handleSave}
          className="rounded bg-indigo-600 px-4 py-2 text-white"
        >
          Salvar
        </button>
        <button type="button" onClick={onClose}>
          Voltar
        </button>
      </div>
    </section>
  );
}
