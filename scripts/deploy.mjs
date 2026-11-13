// 블로그 레포의 content 변경을 커밋하고 푸시한다.
// 블로그 v5 브랜치로 푸시되면 GitHub Actions 가 배포를 시작한다.
import { execFileSync } from "node:child_process"

const run = (cwd, ...args) =>
  execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim()

const BRANCH = "v5"
const blog = process.cwd()
const stamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })

if (run(blog, "branch", "--show-current") !== BRANCH) {
  console.error(`✖ ${BRANCH} 브랜치에서만 실행할 수 있어요.`)
  process.exit(1)
}

await import("./copy-attachments.mjs")

run(blog, "add", "content")
if (run(blog, "diff", "--cached", "--name-only", "--", "content") === "") {
  console.log("블로그에 올릴 변경이 없어요.")
  process.exit(0)
}

console.log(run(blog, "diff", "--cached", "--stat", "--", "content"))
run(blog, "commit", "-m", `Update posts: ${stamp}`, "--", "content")
run(blog, "pull", "--rebase", "origin", BRANCH)
run(blog, "push", "origin", BRANCH)
console.log("✔ 푸시 완료. 몇 분 뒤 https://eeseuju.github.io/blog 에 반영돼요.")
