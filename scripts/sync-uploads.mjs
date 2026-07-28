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
const previewUploadsDir = path.join(publicUploadsDir, 'previews')
const libraryIndexPath = path.join(rootDir, 'docs', 'library', 'index.md')

const supportedDocuments = new Set([
  '.md', '.markdown', '.pdf', '.docx', '.doc',
  '.zip', '.rar', '.7z', '.ppt', '.pptx',
  '.xls', '.xlsx', '.xmind', '.chm', '.txt', '.csv'
])

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
  const documents = await Promise.all(
    uploadFiles
      .filter((relativePath) => supportedDocuments.has(path.extname(relativePath).toLowerCase()))
      .map(async (relativePath) => {
        const stats = await fs.stat(path.join(uploadsDir, ...relativePath.split('/')))
        return createDocumentRecord(relativePath, stats.size)
      })
  )

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

function createDocumentRecord(relativePath, sizeBytes) {
  const ext = path.extname(relativePath).toLowerCase()
  const title = titleFromPath(relativePath)
  const id = `doc-${crypto.createHash('sha1').update(relativePath).digest('hex').slice(0, 10)}`
  const pathParts = relativePath.split('/')
  const firstFolder = pathParts.length > 1 ? pathParts[0] : '未分类'
  const sectionParts = pathParts.slice(1, -1)

  return {
    id,
    title,
    category: firstFolder,
    sectionParts,
    displayPath: [firstFolder, ...sectionParts.map(displaySectionName)].join(' / '),
    relativePath,
    ext,
    sizeBytes,
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
  } else if (document.ext === '.doc') {
    page = renderLegacyDocPage(document)
  } else {
    page = renderDownloadPage(document)
  }

  await fs.writeFile(document.pagePath, page, 'utf8')
}

async function renderMarkdownPage(document, documentByRelativePath, uploadFileSet) {
  const source = stripBom(await fs.readFile(document.sourcePath, 'utf8'))
  const rewritten = rewriteMarkdownLinks(source, document.relativePath, documentByRelativePath, uploadFileSet)
  const { frontmatter, body } = splitFrontmatter(rewritten)
  const prefix = /^#\s+.+$/m.test(body) ? '' : `# ${document.title}\n\n`

  return `${disableGeneratedPageSearch(frontmatter)}${prefix}${body.trimStart()}\n`
}

function renderPdfPage(document) {
  return `---
search: false
---

<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase(${JSON.stringify(document.publicUrl)})
</script>

# ${document.title}

${renderFileMeta(document)}

<p class="kb-download-actions"><a class="kb-download-button" :href="fileUrl" download>下载 PDF</a></p>

<div class="kb-pdf-preview">
  <iframe :src="fileUrl" title="${escapeHtml(document.title)}"></iframe>
</div>
`
}

async function renderDocxPage(document) {
  try {
    const documentPreviewDir = path.join(previewUploadsDir, document.id)
    let imageIndex = 0
    await fs.mkdir(documentPreviewDir, { recursive: true })

    const result = await mammoth.convertToHtml(
      { path: document.sourcePath },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.readAsBuffer()
          const imageName = `image-${String(++imageIndex).padStart(3, '0')}.${extensionForImage(image.contentType)}`
          await fs.writeFile(path.join(documentPreviewDir, imageName), imageBuffer)
          return {
            src: `__KB_WITH_BASE__/uploads/previews/${document.id}/${encodeURIComponent(imageName)}`
          }
        })
      }
    )
    const previewHtml = result.value.replace(
      /src="__KB_WITH_BASE__([^"]+)"/g,
      (_, imageUrl) => `:src="withBase('${imageUrl}')"`
    )

    return `---
search: false
---

<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase(${JSON.stringify(document.publicUrl)})
</script>

# ${document.title}

${renderFileMeta(document)}

<p class="kb-download-actions"><a class="kb-download-button" :href="fileUrl" download>下载原始 Word 文件</a></p>

<div class="kb-document-preview">
${previewHtml}
</div>
`
  } catch (error) {
    return renderLegacyDocPage(document, `DOCX 自动转换失败：${error.message}`)
  }
}

function renderLegacyDocPage(document, note = '旧版 .doc 文件不能直接转换为网页内容。') {
  return `---
search: false
---

<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase(${JSON.stringify(document.publicUrl)})
</script>

# ${document.title}

${renderFileMeta(document)}

${note}

<p class="kb-download-actions"><a class="kb-download-button" :href="fileUrl" download>下载 Word 文件</a></p>
`
}

function renderDownloadPage(document) {
  const typeLabel = labelForExt(document.ext)

  return `---
search: false
---

<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase(${JSON.stringify(document.publicUrl)})
</script>

# ${document.title}

${renderFileMeta(document)}

此文件提供原始格式下载。

<p class="kb-download-actions"><a class="kb-download-button" :href="fileUrl" download>下载 ${typeLabel} 文件</a></p>
`
}

function renderFileMeta(document) {
  return `<div class="kb-file-meta">
  <span><strong>目录</strong>${escapeHtml(document.displayPath)}</span>
  <span><strong>格式</strong>${escapeHtml(labelForExt(document.ext))}</span>
  <span><strong>大小</strong>${escapeHtml(formatFileSize(document.sizeBytes))}</span>
</div>`
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
  const preferred = ['嵌入式', '机器人运动控制']
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
        const directDocuments = categoryDocuments.filter((document) => document.sectionParts.length === 0)
        appendDocumentList(lines, directDocuments)

        const firstSections = [...new Set(
          categoryDocuments
            .filter((document) => document.sectionParts.length > 0)
            .map((document) => document.sectionParts[0])
        )].sort((a, b) => a.localeCompare(b, 'zh-CN'))

        for (const section of firstSections) {
          const sectionDocuments = categoryDocuments.filter((document) => document.sectionParts[0] === section)
          lines.push(`::: details ${displaySectionName(section)}（${sectionDocuments.length} 份）`, '')
          appendSectionContents(lines, sectionDocuments, 1)
          lines.push(':::', '')
        }
      }
      lines.push('')
    }
  }

  await fs.writeFile(libraryIndexPath, `${lines.join('\n')}\n`, 'utf8')
}

function appendSectionContents(lines, documents, consumedSections) {
  const directDocuments = documents.filter(
    (document) => document.sectionParts.length === consumedSections
  )
  appendDocumentList(lines, directDocuments)

  const childSections = [...new Set(
    documents
      .filter((document) => document.sectionParts.length > consumedSections)
      .map((document) => document.sectionParts[consumedSections])
  )].sort((a, b) => a.localeCompare(b, 'zh-CN'))

  for (const section of childSections) {
    const headingLevel = Math.min(consumedSections + 2, 6)
    const childDocuments = documents.filter(
      (document) => document.sectionParts[consumedSections] === section
    )
    lines.push(`${'#'.repeat(headingLevel)} ${displaySectionName(section)}`, '')
    appendSectionContents(lines, childDocuments, consumedSections + 1)
  }
}

function appendDocumentList(lines, documents) {
  for (const document of [...documents].sort(
    (a, b) => a.relativePath.localeCompare(b.relativePath, 'zh-CN')
  )) {
    lines.push(
      `- [${escapeMarkdownText(document.title)}](${document.pageLink}) ` +
      `<Badge text="${labelForExt(document.ext)}" type="info" /> ` +
      `<span class="kb-file-size">${formatFileSize(document.sizeBytes)}</span>`
    )
  }

  if (documents.length > 0) lines.push('')
}

function groupByCategory(documents) {
  const grouped = new Map()

  for (const document of [...documents].sort(
    (a, b) => a.relativePath.localeCompare(b.relativePath, 'zh-CN')
  )) {
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

function disableGeneratedPageSearch(frontmatter) {
  if (!frontmatter) return '---\nsearch: false\n---\n'

  if (/^search\s*:/m.test(frontmatter)) {
    return frontmatter.replace(/^search\s*:.*$/m, 'search: false')
  }

  return frontmatter.replace(/\r?\n---\r?\n$/, '\nsearch: false\n---\n')
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
  return parsed.name.replace(/^\d{1,3}[-_.、\s]+/, '').trim() || parsed.name
}

function displaySectionName(value) {
  return value.replace(/^\d{1,3}[-_.、\s]+/, '').trim() || value
}

function labelForExt(ext) {
  if (ext === '.md' || ext === '.markdown') return 'Markdown'
  if (ext === '.pdf') return 'PDF'
  if (ext === '.docx') return 'DOCX'
  if (ext === '.doc') return 'DOC'
  if (ext === '.zip') return 'ZIP'
  if (ext === '.rar') return 'RAR'
  if (ext === '.7z') return '7Z'
  if (ext === '.ppt') return 'PPT'
  if (ext === '.pptx') return 'PPTX'
  if (ext === '.xls') return 'XLS'
  if (ext === '.xlsx') return 'XLSX'
  if (ext === '.xmind') return 'XMind'
  if (ext === '.chm') return 'CHM'
  if (ext === '.csv') return 'CSV'
  if (ext === '.txt') return 'TXT'
  return ext.replace(/^\./, '').toUpperCase()
}

function formatFileSize(sizeBytes) {
  if (sizeBytes < 1024) return `${sizeBytes} B`
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`
}

function extensionForImage(contentType) {
  const extensions = {
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/tiff': 'tiff',
    'image/bmp': 'bmp',
    'image/x-emf': 'emf',
    'image/x-wmf': 'wmf'
  }

  return extensions[contentType] || 'bin'
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
