# code-video-office

Oficina de agentes que produce vídeos de programación con código real ejecutado
en CI. Sin vídeo generativo. Todo en CPU, todo determinista.

## Flujo
00-investigador -> 01-arquitecto-demo -> 02-programador -> 03-verificador ->
04-guionista -> 05-director -> 06-voz -> 07-render -> 08-editor -> 09-qc ->
10-publicador -> 11-analista

Cada rol lee un archivo, escribe un archivo, pasa una puerta. El QC es el único
que aprueba. Dos rechazos en el mismo beat paran la pipeline con issue.

## Disparo
Workflow `office.yml` por `workflow_dispatch` con input `tema`. El modo `dry-run`
se salta la publicación.

## Local
node tools/validate.mjs work/<id>/brief.json
ffmpeg -i build/<id>/final.mp4 -af loudnorm=print_format=json -f null -

## Coste
Repo público: 0. Solo se necesita CPU.
