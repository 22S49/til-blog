// 글에서 쓰는 첨부파일(![[그림.png]])을 볼트 어딘가에서 찾아 content/Attachments 로 복사한다.
// 단독으로도 실행할 수 있다: node scripts/copy-attachments.mjs
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { basename, join } from "node:path"

const SKIP_DIRS = new Set([".git", ".obsidian", ".trash", "node_modules"])

// 폴더 안의 모든 파일 경로를 모은다(제외 폴더는 건너뜀).
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name), out)
    } else out.push(join(dir, e.name))
  }
  return out
}

const content = realpathSync("content")
const vault = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: content, encoding: "utf8" }).trim()
const dest = join(content, "Attachments")

// ![[a.png]], ![[a.png|300]], ![[폴더/a.png#...]] 에서 파일명만 뽑는다. 노트 임베드(.md/확장자 없음)는 제외.
const wanted = new Set()
for (const md of walk(content).filter((f) => f.endsWith(".md"))) {
  for (const m of readFileSync(md, "utf8").matchAll(/!\[\[([^\]|#]+)/g)) {
    const name = basename(m[1].trim())
    if (/\.\w+$/.test(name) && !name.endsWith(".md")) wanted.add(name)
  }
}

const inVault = new Map()
for (const f of walk(vault)) if (wanted.has(basename(f)) && !inVault.has(basename(f))) inVault.set(basename(f), f)

mkdirSync(dest, { recursive: true })
let copied = 0
for (const name of wanted) {
  const src = inVault.get(name)
  const to = join(dest, name)
  if (!src) {
    if (!existsSync(to)) console.warn(`⚠ 첨부파일을 볼트에서 못 찾았어요: ${name}`)
    continue
  }
  if (existsSync(to) && statSync(to).size === statSync(src).size) continue
  copyFileSync(src, to)
  copied++
}
console.log(`첨부파일: ${wanted.size}개 사용 중, ${copied}개 복사함`)
