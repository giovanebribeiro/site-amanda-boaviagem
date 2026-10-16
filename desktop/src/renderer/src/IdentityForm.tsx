import { useState, type FormEvent } from "react";
import type { Identity } from "../../common/types";

interface Props {
  onSubmit: (identity: Identity) => Promise<string | null>;
}

export function IdentityForm({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(await onSubmit({ name, email }));
  };

  return (
    <main className="mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-2xl font-bold">Bem-vinda</h1>
      <p className="text-gray-600">
        Seu nome e e-mail identificam cada versão salva do site neste
        computador.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block">
          Nome
          <input
            className="mt-1 w-full rounded border border-gray-300 p-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="block">
          E-mail
          <input
            type="email"
            className="mt-1 w-full rounded border border-gray-300 p-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="rounded bg-indigo-600 px-4 py-2 text-white"
        >
          Continuar
        </button>
      </form>
    </main>
  );
}
