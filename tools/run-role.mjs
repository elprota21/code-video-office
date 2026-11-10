#!/usr/bin/env node
// Motor de roles de code-video-office.
//
// Un rol = un archivo .agents/NN-rol.md + entradas -> una salida + una puerta.
// Llama a cualquier API compatible con OpenAI (chat/completions):
//   LLM_API_KEY   (obligatoria) clave del proveedor, en GitHub va como secret
//   LLM_BASE_URL  (defecto https://api.openai.com/v1)
//                 OpenAI:    https://api.openai.com/v1
//                 Venice AI: https://api.venice.ai/api/v1
//                 OpenRouter:https://openrouter.ai/api/v1
//   LLM_MODEL     (obligatoria) modelo a usar, fijado por versión
//
// Uso:
//   node tools/run-role.mjs --role .agents/00-investigador.md \
//     --context content/calendario.json,content/publicado.json \
//     --instruction "tema: saludo con None en Python" \
//     --out work/<id>/brief.json --kind brief
//   node tools/run-role.mjs --role .agents/02-programador.md \
//     --context work/<id>/demo.json --mode files --root demos/<slug>
//
// Puerta: si --kind, tras escribir valida con tools/validate.mjs. Si la salida
// no pasa, devuelve los errores al modelo y reintenta. Máximo 2 reintentos
// (política de AGENTS.md); al tercer fallo sale con código 1.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i];
  if (!k.startsWith("--")) fail(`argumento inesperado: ${k}`);
  args[k.slice(2)] = process.argv[i + 1];
}
function fail(msg) { console.error(`run-role: ${msg}`); process.exit(2); }

const rolePath = args.role ?? fail("falta --role");
const outPath = args.out ?? (args.mode === "files" ? null : fail("falta --out"));
const kind = args.kind ?? null;
const mode = args.mode ?? "json";
const maxAttempts = 3; // 1 intento + 2 reintentos, según AGENTS.md

const apiKey = process.env.LLM_API_KEY ?? fail("falta LLM_API_KEY");
const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const model = process.env.LLM_MODEL ?? fail("falta LLM_MODEL");

const roleText = readFileSync(rolePath, "utf8");
let contract = "";
try { contract = readFileSync("AGENTS.md", "utf8"); } catch { /* opcional */ }

const contextParts = [];
for (const p of (args.context ?? "").split(",").filter(Boolean)) {
  contextParts.push(`--- ${p} ---\n${readFileSync(p, "utf8")}`);
}
if (args.instruction) contextParts.push(`--- instrucción ---\n${args.instruction}`);

const SCHEMAS = {
  brief: ["id", "tema", "angulo", "publico", "dolor", "fuentes", "duplicado"],
  demo: ["slug", "lenguaje", "problema", "estado_roto", "fix", "comando_run",
         "salida_esperada", "lineas_clave", "commit_fijado"],
  guion: ["duracion_objetivo", "beats"],
  storyboard: ["formato", "beats", "assets"],
  render: ["clips", "audio"],
  qc: ["aprobado", "score", "fallos"],
};

const formatRule = mode === "files"
  ? 'Responde SOLO con un objeto JSON de la forma {"files": {"ruta/relativa": "contenido"}}. Sin markdown, sin explicaciones.'
  : "Responde SOLO con el JSON de salida del rol. Sin markdown, sin explicaciones, sin saludos ni confirmaciones.";

const schemaRule = kind && SCHEMAS[kind]
  ? `\n\nEl JSON de salida DEBE tener exactamente estas claves de primer nivel: ${SCHEMAS[kind].join(", ")}.`
  : "";

const messages = [
  { role: "system", content: `${roleText}\n\n${contract}\n\n${formatRule}` },
  { role: "user", content: (contextParts.join("\n\n") || "(sin contexto)") +
      `\n\n--- tarea ---\nEjecuta tu rol sobre el contexto anterior y devuelve tu archivo de salida.${schemaRule}\n${formatRule}` },
];

function extractJson(text) {
  const t = text.replace(/```(?:json)?/g, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("la respuesta no contiene JSON");
  return JSON.parse(t.slice(a, b + 1));
}

const jsonModeHost = baseUrl.includes("models.github.ai") || baseUrl.includes("api.openai.com");

async function callModel() {
  const payload = { model, temperature: 0, messages };
  if (jsonModeHost && mode === "json") payload.response_format = { type: "json_object" };
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("respuesta de la API sin contenido");
  return text;
}

function gate() {
  if (!kind) return [];
  const r = spawnSync("node", ["tools/validate.mjs", outPath], { encoding: "utf8" });
  return r.status === 0 ? [] : (r.stderr || r.stdout).trim().split("\n").filter(Boolean);
}

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  let parsed;
  try {
    const raw = await callModel();
    try {
      parsed = extractJson(raw);
    } catch (e) {
      console.error(`respuesta del modelo sin JSON (primeros 300 caracteres): ${raw.slice(0, 300)}`);
      throw e;
    }
  } catch (e) {
    if (attempt === maxAttempts) fail(`sin JSON válido tras ${maxAttempts} intentos: ${e.message}`);
    messages.push({ role: "user", content: `Tu respuesta anterior no era JSON válido (${e.message}). Devuelve SOLO el JSON de salida, sin ningún otro texto.` });
    continue;
  }

  if (mode === "files") {
    const root = resolve(args.root ?? ".");
    for (const [rel, content] of Object.entries(parsed.files ?? {})) {
      const dest = resolve(join(root, rel));
      if (!dest.startsWith(root)) fail(`ruta fuera de la raíz permitida: ${rel}`);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, content);
    }
    console.log(`rol escrito (modo files) en ${args.root} — intento ${attempt}`);
    process.exit(0);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(parsed, null, 2) + "\n");
  const errs = gate();
  if (errs.length === 0) {
    console.log(`${outPath} escrito y validado — intento ${attempt}`);
    process.exit(0);
  }
  if (attempt === maxAttempts) fail(`puerta no superada tras ${maxAttempts} intentos:\n${errs.join("\n")}`);
  messages.push(
    { role: "assistant", content: JSON.stringify(parsed) },
    { role: "user", content: `Ese JSON no pasa la validación:\n${errs.join("\n")}\nDevuelve el JSON completo corregido, SOLO el JSON.` },
  );
}
