import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'parse5'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(rootDir, 'docs', '.vitepress', 'dist')
const localOrigin = 'https://knowledge-base.invalid'

async function main() {
  const htmlFiles = (await walk(distDir)).filter((filePath) => filePath.endsWith('.html'))
  const broken = []
  let checked = 0

  for (const htmlPath of htmlFiles) {
    const relativeHtmlPath = toPosix(path.relative(distDir, htmlPath))
    const pageUrl = new URL(publicPathForHtml(relativeHtmlPath), localOrigin)
    const document = parse(await fs.readFile(htmlPath, 'utf8'))

    for (const reference of collectReferences(document)) {
      for (const value of expandReference(reference)) {
        const target = resolveLocalReference(value, pageUrl)
        if (!target) continue
        checked += 1
        if (!await targetExists(target)) {
          broken.push(`${relativeHtmlPath}: ${value}`)
        }
      }
    }
  }

  if (broken.length > 0) {
    for (const item of broken.slice(0, 50)) console.error(`- ${item}`)
    if (broken.length > 50) console.error(`- 其余 ${broken.length - 50} 个断链已省略`)
    throw new Error(`Found ${broken.length} broken internal link(s).`)
  }

  console.log(`Checked ${checked} internal references in ${htmlFiles.length} HTML files; no broken links.`)
}

function collectReferences(node, results = []) {
  if (Array.isArray(node.attrs)) {
    for (const attribute of node.attrs) {
      if (['href', 'src', 'poster'].includes(attribute.name)) {
        results.push({ kind: attribute.name, value: attribute.value })
      } else if (attribute.name === 'srcset') {
        results.push({ kind: 'srcset', value: attribute.value })
      }
    }
  }
  for (const child of node.childNodes || []) collectReferences(child, results)
  if (node.content) collectReferences(node.content, results)
  return results
}

function expandReference(reference) {
  if (reference.kind !== 'srcset') return [reference.value]
  return reference.value
    .split(',')
    .map((candidate) => candidate.trim().split(/\s+/)[0])
    .filter(Boolean)
}

function resolveLocalReference(value, pageUrl) {
  const trimmed = value.trim()
  if (!trimmed || trimmed.startsWith('#') || /^(?:data|blob|mailto|tel):/i.test(trimmed)) return null

  let url
  try {
    url = new URL(trimmed, pageUrl)
  } catch {
    return null
  }
  if (url.origin !== localOrigin) return null
  return safeDecodeURIComponent(url.pathname)
}

async function targetExists(publicPath) {
  const relativePath = publicPath.replace(/^\/+/, '')
  if (relativePath.split('/').includes('..')) return false

  const candidates = publicPath.endsWith('/')
    ? [path.join(distDir, relativePath, 'index.html')]
    : path.posix.extname(publicPath)
      ? [path.join(distDir, relativePath)]
      : [
          path.join(distDir, relativePath),
          path.join(distDir, `${relativePath}.html`),
          path.join(distDir, relativePath, 'index.html')
        ]

  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate)
      if (stats.isFile()) return true
    } catch {}
  }
  return false
}

function publicPathForHtml(relativePath) {
  if (relativePath === 'index.html') return '/'
  if (relativePath.endsWith('/index.html')) return `/${relativePath.slice(0, -'index.html'.length)}`
  return `/${relativePath}`
}

async function walk(directory) {
  const results = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) results.push(...await walk(filePath))
    else if (entry.isFile()) results.push(filePath)
  }
  return results
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function toPosix(value) {
  return value.split(path.sep).join('/')
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
