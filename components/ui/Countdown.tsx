import { useState, useEffect } from "react";

interface TimeLeft {
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownProps {
  releaseDate: string;
  linkAmazon: string;
  linkUiclap: string;
}

function computeTimeLeft(diffMs: number): TimeLeft {
  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const totalDays = Math.floor(totalHours / 24);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, hours, minutes, seconds };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function Countdown({
  releaseDate,
  linkAmazon,
  linkUiclap,
}: CountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setMounted(true);

    const target = new Date(releaseDate + "T00:00:00").getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
      } else {
        setTimeLeft(computeTimeLeft(diff));
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [releaseDate]);

  // SSR guard: antes do mount, nada é renderizado para evitar hydration mismatch
  if (!mounted) return null;

  // Data no passado: exibe links de compra
  if (timeLeft === null) {
    return (
      <div className="flex flex-wrap gap-4">
        {linkAmazon && (
          <a
            href={linkAmazon}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans font-medium px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Amazon
          </a>
        )}
        {linkUiclap && (
          <a
            href={linkUiclap}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans font-medium px-8 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
          >
            Uiclap
          </a>
        )}
      </div>
    );
  }

  // Data no futuro: exibe contador
  const units = [
    { label: "semanas", value: timeLeft.weeks },
    { label: "dias", value: timeLeft.days },
    { label: "horas", value: timeLeft.hours },
    { label: "minutos", value: timeLeft.minutes },
    { label: "segundos", value: timeLeft.seconds },
  ];

  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-widest text-foreground/50 mb-4">
        Lançamento em
      </p>
      <div className="flex flex-wrap gap-4">
        {units.map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center min-w-[3.5rem]">
            <span className="font-serif text-3xl font-bold text-primary tabular-nums">
              {pad(value)}
            </span>
            <span className="font-sans text-xs text-foreground/50 mt-1">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
