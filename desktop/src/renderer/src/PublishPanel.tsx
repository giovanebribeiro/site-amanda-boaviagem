import { useEffect, useRef, useState } from "react";
import type { DeployState } from "../../common/types";

const DEFAULT_POLL_MS = 3000;
const PUBLISH_FAILED = "Algo deu errado ao publicar. Tente de novo.";
const STATUS_FAILED =
  "Não foi possível consultar o estado da publicação agora. Suas versões já foram enviadas.";

type Phase =
  | { name: "idle" }
  | { name: "sending" }
  | { name: "nothing-new" }
  | { name: "deploy"; state: DeployState };

const PHASE_TEXT: Record<DeployState, string> = {
  building: "Construindo o site… isso pode levar alguns minutos.",
  live: "No ar! O site já está atualizado.",
  failed:
    "Falhou: não foi possível construir o site com as mudanças. O site anterior continua no ar.",
};

interface Props {
  /** Called when the saved access stopped working, so the app asks to sign in again. */
  onNeedsSignIn: (message: string) => void;
  pollMs?: number;
}

export function PublishPanel({
  onNeedsSignIn,
  pollMs = DEFAULT_POLL_MS,
}: Props) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = useRef(0);

  useEffect(
    () => () => {
      run.current += 1;
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const follow = async (sha: string, current: number): Promise<void> => {
    try {
      const result = await window.api.deployState(sha);
      if (run.current !== current) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPhase({ name: "deploy", state: result.state });
      if (result.state === "building") {
        timer.current = setTimeout(() => void follow(sha, current), pollMs);
      }
    } catch (failure) {
      console.error("deployState failed", failure);
      if (run.current === current) setError(STATUS_FAILED);
    }
  };

  const handlePublish = async (): Promise<void> => {
    run.current += 1;
    const current = run.current;
    if (timer.current !== null) clearTimeout(timer.current);
    setError(null);
    setPhase({ name: "sending" });
    try {
      const result = await window.api.publish();
      if (run.current !== current) return;
      if (!result.ok) {
        setPhase({ name: "idle" });
        if (result.needsSignIn) onNeedsSignIn(result.error);
        else setError(result.error);
        return;
      }
      if (!result.sent) {
        setPhase({ name: "nothing-new" });
        return;
      }
      setPhase({ name: "deploy", state: "building" });
      await follow(result.sha, current);
    } catch (failure) {
      console.error("publish failed", failure);
      if (run.current === current) {
        setPhase({ name: "idle" });
        setError(PUBLISH_FAILED);
      }
    }
  };

  const sending = phase.name === "sending";
  const building = phase.name === "deploy" && phase.state === "building";

  return (
    <section aria-label="Publicação" className="space-y-2">
      <button
        type="button"
        disabled={sending || building}
        onClick={() => void handlePublish()}
        className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50"
      >
        Publicar
      </button>
      {error !== null && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <p aria-live="polite" className="text-gray-700">
        {sending && "Enviando as suas versões salvas…"}
        {phase.name === "nothing-new" &&
          "Nada novo para publicar. O site já está com as suas versões."}
        {phase.name === "deploy" && PHASE_TEXT[phase.state]}
      </p>
    </section>
  );
}
