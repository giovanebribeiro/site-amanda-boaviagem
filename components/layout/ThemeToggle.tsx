import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { FiSun } from "@react-icons/all-files/fi/FiSun";
import { FiMoon } from "@react-icons/all-files/fi/FiMoon";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita hidratação mismatch — renderiza só no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <Button
        isIconOnly
        variant="light"
        aria-label="Alternar tema"
        className="text-foreground opacity-0"
      >
        <FiSun size={18} />
      </Button>
    );
  }

  return (
    <Button
      isIconOnly
      variant="light"
      onPress={toggleTheme}
      aria-label="Alternar tema"
      className="text-foreground"
    >
      {resolvedTheme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
    </Button>
  );
}
