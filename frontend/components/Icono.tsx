// Set de íconos del sistema de diseño LEX: grilla de 24, trazo 1,75, puntas y uniones
// redondeadas, currentColor. Los trazos vienen de sistema-diseno/fuente/piezas.mjs.
// Son decorativos por defecto (aria-hidden): el texto de al lado dice qué es.

const TRAZOS = {
  "menu": "<path d=\"M4 7h16M4 12h16M4 17h10\"/>",
  "x": "<path d=\"M6 6l12 12M18 6 6 18\"/>",
  "chev-r": "<path d=\"m9.5 6 6 6-6 6\"/>",
  "chev-d": "<path d=\"m6 9.5 6 6 6-6\"/>",
  "briefcase": "<rect x=\"3\" y=\"7\" width=\"18\" height=\"13\" rx=\"3\"/><path d=\"M8.5 7V5.6A1.6 1.6 0 0 1 10.1 4h3.8a1.6 1.6 0 0 1 1.6 1.6V7M3 12.5h18\"/>",
  "calendar": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15.5\" rx=\"3\"/><path d=\"M3.5 10h17M8 3v4M16 3v4\"/>",
  "calendar-plus": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"15.5\" rx=\"3\"/><path d=\"M3.5 10h17M8 3v4M16 3v4M12 12.8v5M9.5 15.3h5\"/>",
  "cap": "<path d=\"M2.5 9.5 12 5l9.5 4.5L12 14z\"/><path d=\"M6.5 11.6v4.1c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.1M21.5 9.5v5\"/>",
  "check": "<path d=\"m5 12.5 4.5 4.5L19 7.5\"/>",
  "check-circle": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m8 12.3 2.7 2.7 5.5-5.6\"/>",
  "shield": "<path d=\"M12 3.2 19.5 6v5.6c0 4.5-3.1 8.1-7.5 9.4-4.4-1.3-7.5-4.9-7.5-9.4V6z\"/><circle cx=\"12\" cy=\"10.6\" r=\"1.7\"/><path d=\"M12 12.3v3.2\"/>",
  "home": "<path d=\"M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15V15h-6v5.5H5.5A1.5 1.5 0 0 1 4 19z\"/>",
  "inbox": "<path d=\"M3.5 13.5 6.2 5.4A2 2 0 0 1 8.1 4h7.8a2 2 0 0 1 1.9 1.4l2.7 8.1V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z\"/><path d=\"M3.5 13.5h4.8l1.4 2.4h4.6l1.4-2.4h4.8\"/>",
  "receipt": "<path d=\"M6 3.5h12v17l-2.4-1.4-2.2 1.4-1.4-1.1-1.4 1.1-2.2-1.4L6 20.5z\"/><path d=\"M9 8.2h6M9 11.7h6M9 15.2h3.5\"/>",
  "users": "<circle cx=\"9\" cy=\"8.5\" r=\"3.2\"/><path d=\"M3.5 19.5c.5-3 2.8-5 5.5-5s5 2 5.5 5\"/><circle cx=\"17\" cy=\"9.6\" r=\"2.5\"/><path d=\"M15.6 14.3c2.4 0 4.3 1.7 4.9 4.4\"/>",
  "id": "<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><circle cx=\"8.5\" cy=\"10.8\" r=\"2\"/><path d=\"M5.6 16c.5-1.4 1.6-2.2 2.9-2.2s2.4.8 2.9 2.2M14 10h4M14 13.5h3\"/>",
  "logout": "<path d=\"M14.5 4h3.5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3.5M10 16l-4-4 4-4M6 12h9.5\"/>",
  "pin": "<path d=\"M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z\"/><circle cx=\"12\" cy=\"10\" r=\"2.3\"/>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7.5V12l3 2\"/>",
  "star": "<path d=\"m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z\"/>",
  "user": "<circle cx=\"12\" cy=\"8\" r=\"3.5\"/><path d=\"M5 20c.7-3.6 3.6-6 7-6s6.3 2.4 7 6\"/>",
  "paw": "<circle cx=\"6.3\" cy=\"11\" r=\"1.8\"/><circle cx=\"9.6\" cy=\"6.9\" r=\"1.9\"/><circle cx=\"14.4\" cy=\"6.9\" r=\"1.9\"/><circle cx=\"17.7\" cy=\"11\" r=\"1.8\"/><path d=\"M12 12.4c-2.6 0-5 2.9-5 5.1 0 1.5 1.2 2.5 2.6 2.5.9 0 1.6-.4 2.4-.4s1.5.4 2.4.4c1.4 0 2.6-1 2.6-2.5 0-2.2-2.4-5.1-5-5.1z\"/>",
  "info": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v5.5M12 7.7v.2\"/>",
  "alert": "<path d=\"M10.3 4.9a2 2 0 0 1 3.4 0l7.4 12.8a2 2 0 0 1-1.7 3H4.6a2 2 0 0 1-1.7-3z\"/><path d=\"M12 9.5V14M12 17v.2\"/>",
  "alert-circle": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7.5V13M12 16.3v.2\"/>",
  "refresh": "<path d=\"M19.5 5v5h-5\"/><path d=\"M19.3 10A7.5 7.5 0 1 0 18 16.5\"/>",
  "filter": "<path d=\"M4 7h8.5M17.5 7H20M4 17h2.5M11.5 17H20\"/><circle cx=\"15\" cy=\"7\" r=\"2.3\"/><circle cx=\"9\" cy=\"17\" r=\"2.3\"/>",
  "plus": "<path d=\"M12 5v14M5 12h14\"/>",
  "compass": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1z\"/>",
  "contrast": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><path fill=\"currentColor\" stroke=\"none\" d=\"M12 3.5a8.5 8.5 0 0 1 0 17z\"/>",
  "steth": "<path d=\"M6 3.5v5a4 4 0 0 0 8 0v-5M5 3.5h2M13 3.5h2M10 12.5v2.5a4.5 4.5 0 0 0 9 0v-1.6\"/><circle cx=\"19\" cy=\"11.4\" r=\"2\"/>",
  "tag": "<path d=\"M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.1 6.1a1.5 1.5 0 0 1-2.1 0z\"/><circle cx=\"8\" cy=\"8\" r=\"1.4\"/>",
  "card": "<rect x=\"3\" y=\"5.5\" width=\"18\" height=\"13\" rx=\"3\"/><path d=\"M3 10h18M7 14.5h3.5\"/>",
  "file-check": "<path d=\"M7 3.5h7l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z\"/><path d=\"M14 3.5V8h4.5M9 14l2 2 4-4\"/>",
  "heart": "<path d=\"M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z\"/>",
  "tooth": "<path d=\"M8 3.6c-2.5 0-4 2-4 4.6 0 2.4.9 4.2 1.5 6.3.6 2.1.9 5.9 2.5 5.9 1.7 0 1.8-4.6 4-4.6s2.3 4.6 4 4.6c1.6 0 1.9-3.8 2.5-5.9.6-2.1 1.5-3.9 1.5-6.3 0-2.6-1.5-4.6-4-4.6-1.6 0-2.6.9-4 .9s-2.4-.9-4-.9z\"/>",
  "syringe": "<path d=\"m15.5 3.5 5 5M18 6l-2.6 2.6M16.6 7.4 8 16l-3-3 8.6-8.6zM5 19l2-2M3.5 20.5 5 19M11 10l1.5 1.5M8.8 12.2l1.5 1.5\"/>",
  "browser": "<rect x=\"3\" y=\"4.5\" width=\"18\" height=\"15\" rx=\"2.5\"/><path d=\"M3 9h18M6.3 6.8h.1M8.6 6.8h.1M6.5 13h6.5M6.5 16h4\"/><rect x=\"15\" y=\"12.3\" width=\"3\" height=\"4.2\" rx=\".8\"/>",
  "sigma": "<path d=\"M17 5H7l5.5 7L7 19h10\"/>",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({
  nombre,
  className = "size-5",
}: {
  nombre: NombreIcono;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
      dangerouslySetInnerHTML={{ __html: TRAZOS[nombre] }}
    />
  );
}
