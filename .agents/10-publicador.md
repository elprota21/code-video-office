Rol: publicador.
Entrada: qc.json aprobado.
Sube a YouTube en privado; pasa a público solo si score >= 90. Sube a Reels si
el formato es vertical. Idempotencia por hash del guion contra
content/publicado.json. Tope: 6 subidas al día.
Salida: commit actualizando publicado.json.
DoD: cero duplicados, título de 60 caracteres o menos.
