/**
 * เติมค่าลง template Word ที่เขียน tag แบบ docxtpl (Jinja) — ทำงานในเบราว์เซอร์แทน docxtpl ของ backend เดิม
 * รองรับเฉพาะรูปแบบที่แบบฟอร์มของปีงบใช้:
 *   {{ a.b }}  {{ x|length + 1 }}  {{ loop.index }}
 *   {%p for x in y %} / {%tr for ... %} / {%p if x %} ... {%p endfor %} {%p endif %} (มี else ได้)
 * tag ที่ไม่มีข้อมูลให้ = error (เหมือน StrictUndefined) ไม่ใช่ช่องว่าง
 */
import PizZip from "pizzip"

export class TemplateDataError extends Error {}

type Node =
  | { kind: "text"; text: string }
  | { kind: "expr"; expr: string }
  | { kind: "for"; name: string; iterable: string; body: Node[] }
  | { kind: "if"; cond: string; body: Node[]; orElse: Node[] }

const XML_ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" }

/** เหมือน DocxTemplate.patch_xml: ลบ xml ที่แทรกกลาง tag และให้ {%p/tr/tc/r แทนทั้งย่อหน้า/แถว/ช่อง/run */
export function patchXml(xml: string): string {
  let src = xml.replace(/(?<=\{)(<[^>]*>)+(?=[{%#])|(?<=[%}#])(<[^>]*>)+(?=\})/gs, "")
  src = src.replace(/\{%(?:(?!%\}).)*|\{#(?:(?!#\}).)*|\{\{(?:(?!\}\}).)*/gs, (m) => m.replace(/<\/w:t>.*?(<w:t>|<w:t [^>]*>)/gs, ""))
  // เว้นวรรคหน้า/หลังค่าที่เติมไม่ถูก Word ตัดทิ้ง (กติกาเดียวกับ docxtpl)
  src = src.replace(/<w:t>((?:(?!<w:t>).)*?)(\{\{.*?\}\}|\{%.*?%\})/gs, '<w:t xml:space="preserve">$1$2')
  for (const y of ["tr", "tc", "p", "r"]) {
    const pattern = new RegExp(`<w:${y}[ >](?:(?!<w:${y}[ >]).)*(\\{%|\\{\\{)${y} ([^}%]*(?:%\\}|\\}\\})).*?</w:${y}>`, "gs")
    src = src.replace(pattern, "$1 $2")
  }
  return src.replace(/(?<=\{[{%])(.*?)(?=[}%]\})/gs, (m) =>
    m
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/&(amp|lt|gt|quot|apos);/g, (e) => XML_ENTITIES[e]),
  )
}

function parse(src: string): Node[] {
  const root: Node[] = []
  const stack: { node: Extract<Node, { kind: "for" | "if" }>; inElse: boolean }[] = []
  const push = (node: Node) => {
    const top = stack[stack.length - 1]
    if (!top) root.push(node)
    else if (top.node.kind === "if" && top.inElse) top.node.orElse.push(node)
    else top.node.body.push(node)
  }
  const pattern = /\{\{(.*?)\}\}|\{%(.*?)%\}/gs
  let last = 0
  for (const match of src.matchAll(pattern)) {
    if (match.index! > last) push({ kind: "text", text: src.slice(last, match.index) })
    last = match.index! + match[0].length
    if (match[1] !== undefined) {
      push({ kind: "expr", expr: match[1].trim() })
      continue
    }
    const statement = match[2].trim()
    const forMatch = /^for\s+(\w+)\s+in\s+(.+)$/.exec(statement)
    const ifMatch = /^if\s+(.+)$/.exec(statement)
    if (forMatch) {
      const node: Node = { kind: "for", name: forMatch[1], iterable: forMatch[2].trim(), body: [] }
      push(node)
      stack.push({ node, inElse: false })
    } else if (ifMatch) {
      const node: Node = { kind: "if", cond: ifMatch[1].trim(), body: [], orElse: [] }
      push(node)
      stack.push({ node, inElse: false })
    } else if (statement === "else" && stack[stack.length - 1]?.node.kind === "if") {
      stack[stack.length - 1].inElse = true
    } else if ((statement === "endfor" && stack[stack.length - 1]?.node.kind === "for") || (statement === "endif" && stack[stack.length - 1]?.node.kind === "if")) {
      stack.pop()
    } else {
      throw new TemplateDataError(`แบบฟอร์มใช้คำสั่งที่ระบบไม่รองรับ: {% ${statement} %}`)
    }
  }
  if (stack.length) throw new TemplateDataError("แบบฟอร์มมี {% for %} หรือ {% if %} ที่ไม่ได้ปิด")
  if (last < src.length) push({ kind: "text", text: src.slice(last) })
  return root
}

type Scope = Record<string, unknown>

function lookup(path: string, scope: Scope): unknown {
  const [head, ...rest] = path.split(".")
  if (!(head in scope)) throw new TemplateDataError(`'${head}' is undefined`)
  let value: unknown = scope[head]
  let name = head
  for (const key of rest) {
    if (value === null || typeof value !== "object" || !(key in (value as object))) {
      throw new TemplateDataError(`'${name}' has no attribute '${key}'`)
    }
    value = (value as Record<string, unknown>)[key]
    name = `${name}.${key}`
  }
  return value
}

function evaluate(expr: string, scope: Scope): unknown {
  const terms = expr.split("+").map((t) => t.trim())
  const values = terms.map((term) => {
    if (/^-?\d+$/.test(term)) return Number(term)
    const [path, ...filters] = term.split("|").map((t) => t.trim())
    let value = lookup(path, scope)
    for (const filter of filters) {
      if (filter !== "length") throw new TemplateDataError(`แบบฟอร์มใช้ filter ที่ระบบไม่รองรับ: ${filter}`)
      value = Array.isArray(value) || typeof value === "string" ? value.length : Object.keys(value as object).length
    }
    return value
  })
  return values.length === 1 ? values[0] : values.reduce((a, b) => (a as number) + (b as number))
}

const truthy = (value: unknown) =>
  Array.isArray(value) ? value.length > 0 : value !== null && typeof value === "object" ? Object.keys(value).length > 0 : Boolean(value)

const escapeXml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&#34;").replace(/'/g, "&#39;")

function display(value: unknown): string {
  if (value === null || value === undefined) return "None"
  if (typeof value === "boolean") return value ? "True" : "False"
  return String(value)
}

function renderNodes(nodes: Node[], scope: Scope): string {
  let out = ""
  for (const node of nodes) {
    if (node.kind === "text") out += node.text
    else if (node.kind === "expr") out += escapeXml(display(evaluate(node.expr, scope)))
    else if (node.kind === "if") out += renderNodes(truthy(evaluate(node.cond, scope)) ? node.body : node.orElse, scope)
    else {
      const items = evaluate(node.iterable, scope)
      if (!Array.isArray(items)) throw new TemplateDataError(`'${node.iterable}' ไม่ใช่รายการ`)
      items.forEach((item, index) => {
        const loop = { index: index + 1, index0: index, first: index === 0, last: index === items.length - 1, length: items.length }
        out += renderNodes(node.body, { ...scope, [node.name]: item, loop })
      })
    }
  }
  return out
}

/** ข้อความที่มีหลายบรรทัด → ขึ้นบรรทัดใหม่ใน run เดิม (เหมือน resolve_listing ของ docxtpl) */
function resolveLineBreaks(xml: string): string {
  return xml.replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g, (run) =>
    run.includes("\n") || run.includes("\t")
      ? run.replace(/\t/g, '</w:t><w:tab/><w:t xml:space="preserve">').replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">')
      : run,
  )
}

/** รูปภาพที่อยู่ใน loop ถูกคัดลอกซ้ำ → ให้เลข docPr ใหม่ไม่ซ้ำกัน (เหมือน fix_docpr_ids ของ docxtpl) */
function fixDocPrIds(xml: string): string {
  let next = 1000
  return xml.replace(/(<wp:docPr\s[^>]*?id=")\d+"/g, (_, head: string) => `${head}${++next}"`)
}

export function renderXml(xml: string, context: Scope): string {
  return fixDocPrIds(resolveLineBreaks(renderNodes(parse(patchXml(xml)), context)))
}

const PART = /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/

/** ชื่อข้อมูลระดับบนสุดที่ template ใช้ (ไม่รวมตัวแปรของ loop) — ใช้ตรวจ template กับข้อมูลที่ระบบมีให้ */
export function templateVariables(template: ArrayBuffer): string[] {
  const zip = new PizZip(template)
  const names = new Set<string>()
  const walk = (nodes: Node[], locals: Set<string>) => {
    const take = (expr: string) =>
      expr
        .split("+")
        .map((t) => t.split("|")[0].trim().split(".")[0])
        .filter((n) => n && !/^\d+$/.test(n) && !locals.has(n) && n !== "loop")
        .forEach((n) => names.add(n))
    for (const node of nodes) {
      if (node.kind === "expr") take(node.expr)
      else if (node.kind === "if") {
        take(node.cond)
        walk(node.body, locals)
        walk(node.orElse, locals)
      } else if (node.kind === "for") {
        take(node.iterable)
        walk(node.body, new Set([...locals, node.name]))
      }
    }
  }
  for (const name of Object.keys(zip.files)) {
    if (PART.test(name)) walk(parse(patchXml(zip.file(name)!.asText())), new Set())
  }
  return [...names].sort()
}

export function renderDocx(template: ArrayBuffer, context: Scope): Blob {
  const zip = new PizZip(template)
  for (const name of Object.keys(zip.files)) {
    if (!PART.test(name)) continue
    const xml = zip.file(name)!.asText()
    if (xml.includes("{{") || xml.includes("{%")) zip.file(name, renderXml(xml, context))
  }
  return zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  })
}
