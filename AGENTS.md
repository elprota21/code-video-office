# Contrato de la oficina

Un agente = un rol = un archivo de entrada = un archivo de salida = una puerta.

## Política
- Máximo 2 reintentos por puerta. Al tercer fallo: issue con `bloqueado` y
  `needs-human`, pipeline detenida.
- Todo dato que un rol necesita y no tiene: falla. No rellena.
- 07-render y 08-editor no escriben en demos/.
- 09-qc es el único que aprueba. `aprobado:true` es condición para publicar.
- Nadie escribe en main. Todo por PR con required checks.
- Determinismo: commit del demo fijado, herramientas fijadas por SHA, fuentes
  fijadas por versión. Dos ejecuciones idénticas o rechazo.

## Esquemas (validar con tools/validate.mjs)
brief.json:      { id, tema, angulo, publico, dolor, fuentes[], duplicado }
demo.json:       { slug, lenguaje, problema, estado_roto, fix, comando_run,
                   salida_esperada, lineas_clave[], commit_fijado }
guion.json:      { duracion_objetivo, beats[{ t, tipo, narracion, en_pantalla,
                   lineas[], salida_esperada }] }
storyboard.json: { formato, beats[{ t, herramienta, tape_spec, rango_lineas,
                   zoom, texto }], assets[] }
render.json:     { clips[{ beat, ruta, duracion }], audio{ voz, musica, lufs } }
qc.json:         { aprobado, score, fallos[{ criterio, detalle }] }

## Rúbrica de vídeo perfecto (bloqueante, la aplica 09-qc)
1. El demo instala y compila en contenedor limpio.
2. Los tests del demo pasan.
3. La salida real aparece en el beat que le corresponde.
4. Hook con el problema planteado antes del segundo 5.
5. Ninguna línea visible supera 62 caracteres en 16:9 ni 12 en 9:16.
6. Audio a -14 LUFS, picos bajo -1 dBTP, sin clipping.
7. Subtítulos con desviación máxima de 80 ms.
8. Cero muletillas de presentación.
9. Duración 45-90 s en vertical, 3-8 min en horizontal.
Score mínimo para aprobar: 85.
