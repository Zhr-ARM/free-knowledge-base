import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const budgets = [
  {
    label: '资料源文件',
    directory: path.join(rootDir, 'uploads'),
    maxBytes: 750 * 1024 * 1024
  },
  {
    label: '发布站点',
    directory: path.join(rootDir, 'docs', '.vitepress', 'dist'),
    maxBytes: 900 * 1024 * 1024
  }
]

async function main() {
  let failed = false
  for (const budget of budgets) {
    const sizeBytes = await directorySize(budget.directory)
    const percent = Math.round((sizeBytes / budget.maxBytes) * 100)
    console.log(`${budget.label}: ${formatSize(sizeBytes)} / ${formatSize(budget.maxBytes)} (${percent}%)`)
    if (sizeBytes > budget.maxBytes) {
      console.error(`${budget.label}超过容量预算，请先迁移大型文件再发布。`)
      failed = true
    }
  }
  if (failed) process.exitCode = 1
}

async function directorySize(directory) {
  let total = 0
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) total += await directorySize(filePath)
    else if (entry.isFile()) total += (await fs.stat(filePath)).size
  }
  return total
}

function formatSize(sizeBytes) {
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
