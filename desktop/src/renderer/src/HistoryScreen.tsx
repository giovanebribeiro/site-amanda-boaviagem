import { useEffect, useState } from "react";
import type { RestoreVersionResult, SavedVersion } from "../../common/types";

type Restored = Extract<RestoreVersionResult, { ok: true }>;

interface Props {
  onRestored: (restored: Restored) => void;
  onClose: () => void;
}

const LOAD_FAILED = "Algo deu errado ao abrir o histórico. Tente de novo.";
const RESTORE_FAILED =
  "Algo deu errado ao voltar para a versão. Tente de novo.";
const RESTORED_NOTICE =
  "Pronto: o conteúdo voltou para essa versão e isso virou uma nova versão salva. O site ainda não foi atualizado.";
const ALREADY_NOTICE = "O conteúdo já está igual a essa versão. Nada mudou.";

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

export function HistoryScreen({ onRestored, onClose }: Props) {
  const [versions, setVersions] = useState<readonly SavedVersion[] | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    window.api
      .listVersions()
      .then((listed) => {
        if (!active) return;
        if (listed.ok) setVersions(listed.versions);
        else setError(listed.error);
      })
      .catch((failure: unknown) => {
        console.error("listVersions failed", failure);
        if (active) setError(LOAD_FAILED);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRestore = async (id: string): Promise<void> => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const restored = await window.api.restoreVersion(id);
      if (!restored.ok) {
        setError(restored.error);
        return;
      }
      setVersions(restored.versions);
      setNotice(restored.versionCreated ? RESTORED_NOTICE : ALREADY_NOTICE);
      onRestored(restored);
    } catch (failure) {
      console.error("restoreVersion failed", failure);
      setError(RESTORE_FAILED);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Histórico" className="space-y-4">
      <h2 className="text-xl font-semibold">Histórico</h2>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-green-700">
          {notice}
        </p>
      )}
      {versions !== null && versions.length === 0 && (
        <p>Nenhuma versão salva ainda.</p>
      )}
      {versions !== null && versions.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded border border-gray-200">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex items-center justify-between gap-4 p-3"
            >
              <span>
                <span className="block text-sm text-gray-600">
                  {formatDate(version.date)}
                </span>
                {version.description}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleRestore(version.id)}
                className="rounded border border-indigo-600 px-3 py-1 text-indigo-700 disabled:opacity-50"
              >
                Voltar para esta versão
              </button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onClose}>
        Fechar
      </button>
    </section>
  );
}
