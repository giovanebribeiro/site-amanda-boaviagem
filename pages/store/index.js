// Deprecated: substituído por /#livros anchor link no Phase 2.
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function StorePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/#livros"); }, [router]);
  return null;
}
