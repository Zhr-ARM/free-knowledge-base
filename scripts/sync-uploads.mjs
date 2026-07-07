import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mammoth from 'mammoth'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const uploadsDir = path.join(rootDir, 'uploads')
const generatedDir = path.join(rootDir, 'docs', 'library', 'generated')
const publicUploadsDir = path.join(rootDir, 'docs', 'public', 'uploads')
const rawUploadsDir = path.join(publicUploadsDir, 'raw')
const libraryIndexPath = path.join(rootDir, 'docs', 'library', 'index.md')

const supportedDocuments = new Set(['.md', '.markdown', '.pdf', '.docx', '.doc'])

async function main() {
  await fs.mkdir(uploadsDir, { recursive: true })
  await fs.rm(generatedDir, { recursive: true, force: true })
  await fs.rm(publicUploadsDir, { recursive: true, force: true })
  await fs.mkdir(generatedDir, { recursive: true })
  await fs.mkdir(rawUploadsDir, { recursive: true })

  const files = await walk(uploadsDir)
  const uploadFiles = files
    .map((filePath) => toPosix(path.relative(uploadsDir, filePath)))
    .filter((relativePath) => !isIgnoredUpload(relativePath))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))

  const uploadFileSet = new Set(uploadFiles)
  const documents = uploadFiles
    .filter((relativePath) => supportedDocuments.has(path.extname(relativePath).toLowerCase()))
    .map((relativePath) => createDocumentRecord(relativePath))

  const documentByRelativePath = new Map(documents.map((document) => [document.relativePath, document]))

  for (const relativePath of uploadFiles) {
    await copyRawUpload(relativePath)
  }

  for (const document of documents) {
    await writeGeneratedDocument(document, documentByRelativePath, uploadFileSet)
  }

  const categories = await getLibraryCategories(documents)
  await writeLibraryIndex(documents, categories)
  console.log(`Synced ${documents.length} document(s) from uploads/.`)
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const results = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await walk(fullPath))
    } else if (entry.isFile()) {
      results.push(fullPath)
    }
  }

  return results
}

function isIgnoredUpload(relativePath) {
  const parts = relativePath.split('/')
  const fileName = parts.at(-1) || ''
  return fileName.startsWith('.') || relativePath === 'README.md'
}

function createDocumentRecord(relativePath) {
  const ext = path.extname(relativePath).toLowerCase()
  const title = titleFromPath(relativePath)
  const id = `doc-${crypto.createHash('sha1').update(relativePath).digest('hex').slice(0, 10)}`
  const firstFolder = relativePath.includes('/') ? relativePath.split('/')[0] : '未分类'

  return {
    id,
    title,
    category: firstFolder,
    relativePath,
    ext,
    sourcePath: path.join(uploadsDir, ...relativePath.split('/')),
    pagePath: path.join(generatedDir, `${id}.md`),
    pageLink: `/library/generated/${id}`,
    publicUrl: `/uploads/raw/${encodePath(relativePath)}`
  }
}

async function copyRawUpload(relativePath) {
  const sourcePath = path.join(uploadsDir, ...relativePath.split('/'))
  const targetPath = path.join(rawUploadsDir, ...relativePath.split('/'))
  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.copyFile(sourcePath, targetPath)
}

async function writeGeneratedDocument(document, documentByRelativePath, uploadFileSet) {
  let page

  if (document.ext === '.md' || document.ext === '.markdown') {
    page = await renderMarkdownPage(document, documentByRelativePath, uploadFileSet)
  } else if (document.ext === '.pdf') {
    page = renderPdfPage(document)
  } else if (document.ext === '.docx') {
    page = await renderDocxPage(document)
  } else {
    page = renderLegacyDocPage(document)
  }

  await fs.writeFile(document.pagePath, page, 'utf8')
}

async function renderMarkdownPage(document, documentByRelativePath, uploadFileSet) {
  const source = stripBom(await fs.readFile(document.sourcePath, 'utf8'))
  const rewritten = rewriteMarkdownLinks(source, document.relativePath, documentByRelativePath, uploadFileSet)
  const { frontmatter, body } = splitFrontmatter(rewritten)
  const prefix = /^#\s+.+$/m.test(body) ? '' : `# ${document.title}\n\n`

  return `${frontmatter}${prefix}${body.trimStart()}\n`
}

function renderPdfPage(document) {
  return `<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase('${document.publicUrl}')
</script>

# ${document.title}

> 分类：${document.category}

<div style="height: 76vh; border: 1px solid var(--vp-c-divider); border-radius: 8px; overflow: hidden;">
  <iframe :src="fileUrl" title="${escapeHtml(document.title)}" style="width: 100%; height: 100%; border: 0;"></iframe>
</div>

<p><a :href="fileUrl" target="_blank" rel="noreferrer">打开或下载 PDF</a></p>
`
}

async function renderDocxPage(document) {
  try {
    const result = await mammoth.convertToHtml(
      { path: document.sourcePath },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.read('base64')
          return { src: `data:${image.contentType};base64,${imageBuffer}` }
        })
      }
    )

    return `<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase('${document.publicUrl}')
</script>

# ${document.title}

> 分类：${document.category}

<p><a :href="fileUrl" target="_blank" rel="noreferrer">下载原始 Word 文件</a></p>

<div style="border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 24px; background: var(--vp-c-bg-soft);">
${result.value}
</div>
`
  } catch (error) {
    return renderLegacyDocPage(document, `DOCX 自动转换失败：${error.message}`)
  }
}

function renderLegacyDocPage(document, note = '旧版 .doc 文件不能直接转换为网页内容。') {
  return `<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase('${document.publicUrl}')
</script>

# ${document.title}

> 分类：${document.category}

${note}

<p><a :href="fileUrl" target="_blank" rel="noreferrer">下载 Word 文件</a></p>
`
}

function rewriteMarkdownLinks(source, currentRelativePath, documentByRelativePath, uploadFileSet) {
  return source.replace(/(!?\[[^\]]*?\]\()([^)\s]+)(\))/g, (match, prefix, href, suffix) => {
    if (isExternalHref(href)) return match

    const { pathname, rest } = splitHref(href)
    const decodedPath = safeDecodeURIComponent(pathname)
    const targetRelativePath = normalizeUploadPath(path.posix.join(path.posix.dirname(currentRelativePath), decodedPath))

    if (documentByRelativePath.has(targetRelativePath)) {
      return `${prefix}${documentByRelativePath.get(targetRelativePath).pageLink}${rest}${suffix}`
    }

    if (uploadFileSet.has(targetRelativePath)) {
      return `${prefix}../../uploads/raw/${encodePath(targetRelativePath)}${rest}${suffix}`
    }

    return match
  })
}

async function getLibraryCategories(documents) {
  const preferred = ['单片机', 'ROS', '开源项目']
  const entries = await fs.readdir(uploadsDir, { withFileTypes: true })
  const folderCategories = entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
  const categorySet = new Set([...folderCategories, ...documents.map((document) => document.category)])
  const preferredCategories = preferred.filter((category) => categorySet.has(category))
  const extraCategories = [...categorySet]
    .filter((category) => !preferred.includes(category))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))

  return [...preferredCategories, ...extraCategories]
}

async function writeLibraryIndex(documents, categories) {
  const lines = [
    '# 资料库',
    '',
    '这里按分类汇总开源协会已经公开的学习资料。点击条目可以在线阅读、预览 PDF，或下载原始文件。',
    '',
    '可以通过顶部搜索框查找关键词，也可以按下面的分类浏览。',
    '',
    '暂时没有收录内容的分类会显示“暂无资料”。',
    ''
  ]

  if (categories.length === 0) {
    lines.push('## 暂无资料', '')
    lines.push('当前知识库还没有公开资料。')
  } else {
    const grouped = new Map(groupByCategory(documents))
    for (const category of categories) {
      const categoryDocuments = grouped.get(category) || []
      lines.push(`## ${category}`, '')
      if (categoryDocuments.length === 0) {
        lines.push('暂无资料')
      } else {
        for (const document of categoryDocuments) {
          lines.push(`- [${escapeMarkdownText(document.title)}](${document.pageLink}) <Badge text="${labelForExt(document.ext)}" type="info" />`)
        }
      }
      lines.push('')
    }
  }

  await fs.writeFile(libraryIndexPath, `${lines.join('\n')}\n`, 'utf8')
}

function groupByCategory(documents) {
  const grouped = new Map()

  for (const document of documents.sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'zh-CN'))) {
    if (!grouped.has(document.category)) grouped.set(document.category, [])
    grouped.get(document.category).push(document)
  }

  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
}

function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)
  if (!match) return { frontmatter: '', body: source }
  return { frontmatter: match[0], body: source.slice(match[0].length) }
}

function splitHref(href) {
  const match = href.match(/^([^?#]*)([?#][\s\S]*)?$/)
  return {
    pathname: match?.[1] || href,
    rest: match?.[2] || ''
  }
}

function isExternalHref(href) {
  return /^(?:[a-z]+:|#|\/)/i.test(href)
}

function normalizeUploadPath(value) {
  return path.posix.normalize(value).replace(/^\.\//, '')
}

function titleFromPath(relativePath) {
  const parsed = path.parse(relativePath)
  return parsed.name.replace(/[-_]+/g, ' ').trim() || parsed.name
}

function labelForExt(ext) {
  if (ext === '.md' || ext === '.markdown') return 'Markdown'
  if (ext === '.pdf') return 'PDF'
  if (ext === '.docx') return 'DOCX'
  return 'DOC'
}

function encodePath(relativePath) {
  return relativePath.split('/').map(encodeURIComponent).join('/')
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function escapeMarkdownText(value) {
  return value.replace(/([\\[\]])/g, '\\$1')
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripBom(value) {
  return value.replace(/^\uFEFF/, '')
}

function toPosix(value) {
  return value.split(path.sep).join('/')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
