import { useEffect, useState } from "react";
import type { DeviceCodePrompt } from "../../common/types";

interface Props {
  /** Resolves with an error message, or null once signed in. */
  onSignIn: () => Promise<string | null>;
  /** Shown above the button, e.g. why the author is asked to sign in again. */
  notice?: string | null;
}

export function SignInPanel({ onSignIn, notice = null }: Props) {
  const [prompt, setPrompt] = useState<DeviceCodePrompt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(notice);

  useEffect(() => window.api.onDeviceCode(setPrompt), []);

  const handleClick = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setPrompt(null);
    const failure = await onSignIn();
    if (failure !== null) {
      setError(failure);
      setBusy(false);
    }
  };

  return (
    <section aria-label="Entrar no GitHub" className="space-y-3">
      <p className="text-gray-600">
        Para baixar e publicar o site, entre com a sua conta do GitHub. Você só
        precisa fazer isso uma vez.
      </p>
      {error !== null && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {prompt !== null && (
        <div className="space-y-1 rounded border border-indigo-200 bg-indigo-50 p-4">
          <p>
            O GitHub abriu no seu navegador. Digite este código lá e confirme:
          </p>
          <p className="font-mono text-3xl font-bold tracking-widest">
            {prompt.userCode}
          </p>
          <p className="text-sm text-gray-600">
            Se a página não abriu, acesse {prompt.verificationUri}
          </p>
        </div>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={handleClick}
        className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
      >
        Entrar com o GitHub
      </button>
    </section>
  );
}
