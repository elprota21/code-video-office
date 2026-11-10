#!/usr/bin/env node
import { readFileSync } from "node:fs";

const S = {
  brief: ["id", "tema", "angulo", "publico", "dolor", "fuentes", "duplicado"],
  demo: ["slug", "lenguaje", "problema", "estado_roto", "fix", "comando_run",
         "salida_esperada", "lineas_clave", "commit_fijado"],
  guion: ["duracion_objetivo", "beats"],
  storyboard: ["formato", "beats", "assets"],
  render: ["clips", "audio"],
  qc: ["aprobado", "score", "fallos"],
};

function check(kind, obj) {
  const errs = [];
  for (const k of S[kind]) if (!(k in obj)) errs.push(`falta: ${k}`);
  if (kind === "qc") {
    if (obj.aprobado === true && obj.score < 85) errs.push("score < 85 con aprobado");
    if (obj.aprobado === true && obj.fallos?.length) errs.push("aprobado con fallos");
  }
  if (kind === "guion" && obj.beats?.[0]?.t > 5) errs.push("hook después del s5");
  if (kind === "storyboard") {
    const max = obj.formato === "9:16" ? 12 : 62;
    for (const b of obj.beats ?? [])
      for (const l of b.texto ?? [])
        if (l.length > max) errs.push(`línea de ${l.length} > ${max}: ${l}`);
  }
  return errs;
}

if (process.argv[2] === "--selftest") {
  const ok = check("qc", { aprobado: true, score: 90, fallos: [] });
  const bad = check("guion", { duracion_objetivo: 60, beats: [{ t: 9 }] });
  console.log(ok.length === 0 && bad.length === 1 ? "SELFTEST OK" : "SELFTEST FALLO");
  process.exit(ok.length === 0 && bad.length === 1 ? 0 : 1);
}

const path = process.argv[2];
const kind = path.split("/").pop().replace(".json", "");
const errs = check(kind, JSON.parse(readFileSync(path, "utf8")));
if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
console.log(`${path} valida`);
