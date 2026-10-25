# Instalación en LEX

Copiada de pbakaus/impeccable (commit 9368675, release 4.7.1, Apache 2.0) el 2026-10-25.

Se quitaron `scripts/impeccable` y `scripts/impeccable.cmd`: son el lanzador que descarga y
ejecuta un binario nativo. Sin ellos la skill usa su modo documentado "Launcher unavailable"
(lee PRODUCT.md y DESIGN.md directamente). El detector automático y el modo `live` no están
disponibles; la metodología de audit, critique, polish y el resto de comandos sí.
