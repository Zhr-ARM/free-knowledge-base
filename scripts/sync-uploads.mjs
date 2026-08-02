import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TextDecoder } from 'node:util'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const uploadsDir = path.join(rootDir, 'uploads')
const generatedDir = path.join(rootDir, 'docs', 'library', 'generated')
const publicUploadsDir = path.join(rootDir, 'docs', 'public', 'uploads')
const rawUploadsDir = path.join(publicUploadsDir, 'raw')
const previewUploadsDir = path.join(publicUploadsDir, 'previews')
const libraryIndexPath = path.join(rootDir, 'docs', 'library', 'index.md')
const archiveTextExtensions = new Set([
  '.asm', '.bat', '.c', '.cc', '.cfg', '.cmake', '.cmd', '.conf', '.cpp',
  '.cs', '.css', '.csv', '.cxx', '.go', '.h', '.hpp', '.htm', '.html',
  '.ini', '.ino', '.java', '.js', '.json', '.json5', '.ld', '.lua', '.m',
  '.mak', '.md', '.mk', '.php', '.pri', '.pro', '.properties', '.ps1',
  '.py', '.qrc', '.rs', '.s', '.scss', '.sh', '.sql', '.toml', '.ts',
  '.tsx', '.txt', '.xml', '.yaml', '.yml'
])
const archiveTextNames = new Set([
  'cmakelists.txt', 'license', 'makefile', 'readme'
])
const maxArchivePreviewFiles = 16
const maxArchivePreviewFileBytes = 96 * 1024
const maxArchivePreviewTotalBytes = 640 * 1024

const supportedDocuments = new Set([
  '.md', '.markdown', '.pdf', '.docx', '.doc',
  '.zip', '.rar', '.7z', '.ppt', '.pptx',
  '.xls', '.xlsx', '.xmind', '.chm', '.txt', '.csv'
])

async function main() {
  console.log('Preparing generated document directories...')
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

  console.log(`Copying ${uploadFiles.length} source file(s)...`)
  for (const relativePath of uploadFiles) {
    await copyRawUpload(relativePath)
  }

  console.log(`Generating ${documents.length} document page(s)...`)
  for (const document of documents) {
    if (['.zip', '.xmind', '.xls', '.xlsx', '.csv'].includes(document.ext)) {
      console.log(`  Previewing ${document.relativePath}`)
    }
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
  } else if (document.ext === '.xls' || document.ext === '.xlsx' || document.ext === '.csv') {
    page = await renderSpreadsheetPage(document)
  } else if (document.ext === '.xmind') {
    page = await renderXMindPage(document)
  } else if (document.ext === '.zip') {
    page = await renderZipPage(document)
  } else if (document.ext === '.txt') {
    page = await renderTextPage(document)
  } else {
    page = renderDownloadPage(document)
  }

  page = addGeneratedPageMetadata(page, document)
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
aside: false
pageClass: kb-wide-document
---

<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase(${JSON.stringify(document.publicUrl)})
</script>

# ${document.title}

${renderFileMeta(document)}

<p class="kb-download-actions">
  <a class="kb-download-button" :href="fileUrl" target="_blank" rel="noopener">新窗口大屏阅读</a>
  <a class="kb-download-button kb-download-button-secondary" :href="fileUrl" download>下载 PDF</a>
</p>

<PdfPreview
  :src="fileUrl"
  title="${escapeHtml(document.title)}"
  size="${escapeHtml(formatFileSize(document.sizeBytes))}"
/>
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
aside: false
pageClass: kb-wide-document
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
aside: false
pageClass: kb-wide-document
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

async function renderSpreadsheetPage(document) {
  const workbook = XLSX.read(await fs.readFile(document.sourcePath), {
    type: 'buffer',
    cellDates: true
  })
  const sheets = workbook.SheetNames.map((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName]
    const table = spreadsheetTable(sheet)
    const hiddenState = workbook.Workbook?.Sheets?.[index]?.Hidden || 0

    return {
      name: sheetName,
      hiddenState,
      ...table
    }
  })
  const totalRows = sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0)
  const totalCells = sheets.reduce((sum, sheet) => sum + sheet.nonEmptyCells, 0)

  return `---
search: false
aside: false
pageClass: kb-wide-document
---

<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase(${JSON.stringify(document.publicUrl)})
</script>

# ${document.title}

${renderFileMeta(document)}

<p class="kb-download-actions"><a class="kb-download-button kb-download-button-secondary" :href="fileUrl" download>下载原始表格</a></p>

## 在线预览

<div class="kb-preview-summary">
  <span><strong>${sheets.length}</strong> 个工作表</span>
  <span><strong>${totalRows}</strong> 行有效数据</span>
  <span><strong>${totalCells}</strong> 个非空单元格</span>
</div>

<div class="kb-spreadsheet-preview">
${sheets.map((sheet, index) => renderSpreadsheetSheet(sheet, index === 0)).join('\n')}
</div>
`
}

function spreadsheetTable(sheet) {
  if (!sheet?.['!ref']) {
    return {
      firstColumn: 0,
      columnCount: 0,
      rows: [],
      nonEmptyCells: 0
    }
  }

  const range = XLSX.utils.decode_range(sheet['!ref'])
  const rows = []
  let columnCount = 0
  let nonEmptyCells = 0

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const values = []
    let lastContentIndex = -1

    for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })]
      const value = cell ? XLSX.utils.format_cell(cell) : ''
      values.push(value)

      if (String(value).trim() !== '') {
        lastContentIndex = values.length - 1
        nonEmptyCells += 1
      }
    }

    if (lastContentIndex >= 0) {
      const trimmedValues = values.slice(0, lastContentIndex + 1)
      columnCount = Math.max(columnCount, trimmedValues.length)
      rows.push({
        rowNumber: rowIndex + 1,
        values: trimmedValues
      })
    }
  }

  return {
    firstColumn: range.s.c,
    columnCount,
    rows,
    nonEmptyCells
  }
}

function renderSpreadsheetSheet(sheet, open) {
  const visibility = sheet.hiddenState === 2
    ? '（深度隐藏）'
    : sheet.hiddenState === 1
      ? '（隐藏）'
      : ''
  const summary = `${escapeVueText(sheet.name)}${visibility} · ${sheet.rows.length} 行 · ${sheet.nonEmptyCells} 个非空单元格`

  if (sheet.rows.length === 0) {
    return `<details class="kb-preview-panel kb-sheet-preview"${open ? ' open' : ''}>
  <summary>${summary}</summary>
  <p class="kb-preview-empty">这个工作表暂无可显示内容。</p>
</details>`
  }

  const columnHeaders = Array.from(
    { length: sheet.columnCount },
    (_, index) => `<th scope="col">${XLSX.utils.encode_col(sheet.firstColumn + index)}</th>`
  ).join('')
  const rows = sheet.rows.map((row) => {
    const cells = Array.from({ length: sheet.columnCount }, (_, index) => {
      const value = row.values[index] ?? ''
      return `<td>${escapeVueText(String(value))}</td>`
    }).join('')
    return `<tr><th scope="row">${row.rowNumber}</th>${cells}</tr>`
  }).join('\n')

  return `<details class="kb-preview-panel kb-sheet-preview"${open ? ' open' : ''}>
  <summary>${summary}</summary>
  <div class="kb-table-scroll" tabindex="0" aria-label="${escapeHtml(sheet.name)} 工作表">
    <table class="kb-preview-table">
      <thead><tr><th scope="col">行</th>${columnHeaders}</tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</details>`
}

async function renderXMindPage(document) {
  const archive = await loadZip(document.sourcePath)
  const contentEntry = findZipEntry(archive, 'content.json')

  if (!contentEntry) {
    throw new Error(`${document.relativePath}: XMind 文件中缺少 content.json`)
  }

  const parsedContent = JSON.parse(await contentEntry.async('string'))
  const sheets = normalizeXMindSheets(parsedContent)
  const topicCount = sheets.reduce((sum, sheet) => sum + countXMindTopics(sheet.rootTopic), 0)
  const thumbnailEntry = findZipEntry(archive, 'Thumbnails/thumbnail.png')
  let thumbnailUrl = null

  if (thumbnailEntry) {
    const documentPreviewDir = path.join(previewUploadsDir, document.id)
    await fs.mkdir(documentPreviewDir, { recursive: true })
    await fs.writeFile(
      path.join(documentPreviewDir, 'thumbnail.png'),
      await thumbnailEntry.async('nodebuffer')
    )
    thumbnailUrl = `/uploads/previews/${document.id}/thumbnail.png`
  }

  return `---
search: false
aside: false
pageClass: kb-wide-document
---

<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase(${JSON.stringify(document.publicUrl)})
${thumbnailUrl ? `const thumbnailUrl = withBase(${JSON.stringify(thumbnailUrl)})` : ''}
</script>

# ${document.title}

${renderFileMeta(document)}

<p class="kb-download-actions"><a class="kb-download-button kb-download-button-secondary" :href="fileUrl" download>下载原始 XMind</a></p>

## 在线预览

<div class="kb-preview-summary">
  <span><strong>${sheets.length}</strong> 个画布</span>
  <span><strong>${topicCount}</strong> 个主题</span>
</div>

<div class="kb-xmind-preview">
${thumbnailUrl ? `  <figure class="kb-xmind-thumbnail">
    <img :src="thumbnailUrl" alt="${escapeHtml(document.title)} 思维导图缩略图">
    <figcaption>思维导图总览</figcaption>
  </figure>` : ''}
  <div class="kb-xmind-outline">
${sheets.map((sheet, index) => renderXMindSheet(sheet, index === 0)).join('\n')}
  </div>
</div>
`
}

function normalizeXMindSheets(content) {
  if (Array.isArray(content)) return content
  if (Array.isArray(content?.sheets)) return content.sheets
  return content ? [content] : []
}

function countXMindTopics(topic) {
  if (!topic) return 0
  return 1 + xmindTopicChildren(topic).reduce(
    (sum, child) => sum + countXMindTopics(child),
    0
  )
}

function xmindTopicChildren(topic) {
  const children = topic?.children
  if (!children) return []
  if (Array.isArray(children)) return children.filter(Boolean)

  return Object.values(children)
    .flatMap((value) => Array.isArray(value) ? value : [])
    .filter(Boolean)
}

function renderXMindSheet(sheet, open) {
  const sheetTitle = sheet.title || sheet.rootTopic?.title || '未命名画布'
  const topicCount = countXMindTopics(sheet.rootTopic)

  return `<details class="kb-preview-panel kb-xmind-sheet"${open ? ' open' : ''}>
  <summary>${escapeVueText(sheetTitle)} · ${topicCount} 个主题</summary>
  ${sheet.rootTopic ? `<ul class="kb-topic-tree">${renderXMindTopic(sheet.rootTopic, true)}</ul>` : '<p class="kb-preview-empty">这个画布暂无主题。</p>'}
</details>`
}

function renderXMindTopic(topic, isRoot = false) {
  const children = xmindTopicChildren(topic)
  const childList = children.length > 0
    ? `<ul>${children.map((child) => renderXMindTopic(child)).join('')}</ul>`
    : ''

  return `<li><span${isRoot ? ' class="kb-topic-root"' : ''}>${escapeVueText(topic.title || '未命名主题')}</span>${childList}</li>`
}

async function renderZipPage(document) {
  const archive = await loadZip(document.sourcePath)
  const files = Object.values(archive.files)
    .filter((entry) => !entry.dir && !/[\\/]$/.test(entry.name))
    .map((entry) => {
      const name = normalizeArchivePath(entry.name)
      return {
        entry,
        name,
        sizeBytes: Number(entry._data?.uncompressedSize || 0)
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  const folders = new Set()
  const extensionCounts = new Map()

  for (const file of files) {
    const parts = file.name.split('/')
    for (let index = 1; index < parts.length; index += 1) {
      folders.add(parts.slice(0, index).join('/'))
    }

    const extension = archiveExtension(file.name)
    extensionCounts.set(extension, (extensionCounts.get(extension) || 0) + 1)
  }

  const totalUncompressedBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0)
  const extensionSummary = [...extensionCounts.entries()]
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 12)
  const sourcePreviews = await createArchiveSourcePreviews(files)
  const fileListing = files
    .map((file) => `${formatFileSize(file.sizeBytes).padStart(9)}  ${file.name}`)
    .join('\n')

  return `---
search: false
aside: false
pageClass: kb-wide-document
---

<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase(${JSON.stringify(document.publicUrl)})
const archiveListing = ${serializeForScript(fileListing)}
const sourcePreviewContents = ${serializeForScript(sourcePreviews.map((preview) => preview.content))}
</script>

# ${document.title}

${renderFileMeta(document)}

<p class="kb-download-actions"><a class="kb-download-button kb-download-button-secondary" :href="fileUrl" download>下载完整源码包</a></p>

## 在线预览

<div class="kb-preview-summary">
  <span><strong>${files.length}</strong> 个文件</span>
  <span><strong>${folders.size}</strong> 个目录</span>
  <span><strong>${formatFileSize(totalUncompressedBytes)}</strong> 解压后大小</span>
</div>

<div class="kb-archive-preview">
  <div class="kb-extension-list" aria-label="文件类型统计">
${extensionSummary.map(([extension, count]) => `    <span><strong>${escapeVueText(extension)}</strong>${count}</span>`).join('\n')}
  </div>

  <details class="kb-preview-panel kb-archive-index">
    <summary>查看完整目录 · ${files.length} 个文件</summary>
    <pre v-text="archiveListing"></pre>
  </details>

  <section class="kb-source-previews" aria-labelledby="${document.id}-source-heading">
    <h3 id="${document.id}-source-heading">可读文件预览</h3>
    ${sourcePreviews.length > 0
      ? sourcePreviews.map((preview, index) => renderArchiveSourcePreview(preview, index, index === 0)).join('\n')
      : '<p class="kb-preview-empty">这个压缩包主要包含二进制工程文件，网页中已展示完整目录，暂无可直接转成文本的源码。</p>'}
  </section>
</div>
`
}

async function createArchiveSourcePreviews(files) {
  const candidates = files
    .filter((file) => (
      file.sizeBytes <= maxArchivePreviewFileBytes &&
      isArchiveTextCandidate(file.name)
    ))
    .sort((a, b) => {
      const scoreDifference = archivePreviewScore(a.name) - archivePreviewScore(b.name)
      return scoreDifference || a.name.localeCompare(b.name, 'zh-CN')
    })
  const selectedCandidates = selectArchivePreviewCandidates(candidates)

  const previews = []
  let totalBytes = 0

  for (const file of selectedCandidates) {
    if (previews.length >= maxArchivePreviewFiles) break
    if (totalBytes + file.sizeBytes > maxArchivePreviewTotalBytes) continue

    const buffer = await file.entry.async('nodebuffer')
    if (looksBinary(buffer)) continue

    const decoded = decodeTextBuffer(buffer)
    const maxCharacters = 72000
    const truncated = decoded.length > maxCharacters
    previews.push({
      name: file.name,
      sizeBytes: file.sizeBytes,
      content: truncated ? `${decoded.slice(0, maxCharacters)}\n\n[网页预览到此处，完整内容请下载源码包查看。]` : decoded,
      truncated
    })
    totalBytes += file.sizeBytes
  }

  return previews
}

function selectArchivePreviewCandidates(candidates) {
  const quotas = [
    ['documentation', 3],
    ['source', 8],
    ['header', 3],
    ['configuration', 2]
  ]
  const selected = []
  const selectedNames = new Set()

  for (const [kind, limit] of quotas) {
    const matching = candidates.filter((candidate) => archivePreviewKind(candidate.name) === kind)
    appendArchiveCandidates(selected, selectedNames, matching, limit)
  }

  appendArchiveCandidates(
    selected,
    selectedNames,
    candidates,
    maxArchivePreviewFiles - selected.length
  )
  return selected
}

function appendArchiveCandidates(selected, selectedNames, candidates, limit) {
  if (limit <= 0) return

  const roots = new Set()
  for (const candidate of candidates) {
    if (selected.length >= maxArchivePreviewFiles || roots.size >= limit) break
    if (selectedNames.has(candidate.name)) continue

    const root = normalizeArchivePath(candidate.name).split('/')[0]
    if (roots.has(root)) continue
    roots.add(root)
    selectedNames.add(candidate.name)
    selected.push(candidate)
  }

  const targetSize = Math.min(maxArchivePreviewFiles, selected.length + Math.max(0, limit - roots.size))
  for (const candidate of candidates) {
    if (selected.length >= targetSize) break
    if (selectedNames.has(candidate.name)) continue
    selectedNames.add(candidate.name)
    selected.push(candidate)
  }
}

function archivePreviewKind(fileName) {
  const normalizedName = normalizeArchivePath(fileName)
  const baseName = path.posix.basename(normalizedName).toLowerCase()
  const extension = path.posix.extname(normalizedName).toLowerCase()

  if (
    baseName.startsWith('readme') ||
    baseName === 'license' ||
    extension === '.md' ||
    extension === '.txt'
  ) return 'documentation'

  if (['.h', '.hpp'].includes(extension)) return 'header'
  if (['.asm', '.c', '.cc', '.cpp', '.cs', '.cxx', '.go', '.ino', '.java', '.js', '.lua', '.m', '.py', '.rs', '.s', '.ts', '.tsx'].includes(extension)) {
    return 'source'
  }
  return 'configuration'
}

function renderArchiveSourcePreview(preview, index, open) {
  const status = preview.truncated ? ' · 已截取' : ''
  return `<details class="kb-preview-panel kb-code-preview"${open ? ' open' : ''}>
  <summary><span>${escapeVueText(preview.name)}</span><small>${formatFileSize(preview.sizeBytes)}${status}</small></summary>
  <pre><code v-text="sourcePreviewContents[${index}]"></code></pre>
</details>`
}

async function renderTextPage(document) {
  const source = stripBom(await fs.readFile(document.sourcePath, 'utf8'))

  return `---
search: false
aside: false
pageClass: kb-wide-document
---

<script setup>
import { withBase } from 'vitepress'

const fileUrl = withBase(${JSON.stringify(document.publicUrl)})
const textPreview = ${serializeForScript(source)}
</script>

# ${document.title}

${renderFileMeta(document)}

<p class="kb-download-actions"><a class="kb-download-button kb-download-button-secondary" :href="fileUrl" download>下载原始文本</a></p>

## 在线预览

<div class="kb-text-preview"><pre v-text="textPreview"></pre></div>
`
}

function renderDownloadPage(document) {
  const typeLabel = labelForExt(document.ext)

  return `---
search: false
aside: false
pageClass: kb-wide-document
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
  const libraryDocuments = [...documents]
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath, 'zh-CN'))
    .map((document) => ({
      title: document.title,
      category: document.category,
      path: document.displayPath,
      type: labelForExt(document.ext),
      size: formatFileSize(document.sizeBytes),
      link: document.pageLink
    }))
  const lines = [
    '---',
    'sidebar: false',
    'aside: false',
    'outline: false',
    'pageClass: kb-library-page',
    '---',
    '',
    '<script setup>',
    `const libraryDocuments = ${serializeForScript(libraryDocuments)}`,
    '</script>',
    '',
    '# 资料库',
    '',
    '这里按分类汇总开源协会已经公开的学习资料。点击条目可以在线阅读、预览 PDF，或下载原始文件。',
    '',
    '可以使用下面的资料搜索直接查找文件，也可以继续按分类浏览。',
    '',
    '暂时没有收录内容的分类会显示“暂无资料”。',
    '',
    '<LibrarySearch :documents="libraryDocuments" />',
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

function addGeneratedPageMetadata(source, document) {
  const { frontmatter, body } = splitFrontmatter(source)
  let result = frontmatter || '---\n---\n'
  result = setFrontmatterValue(result, 'title', JSON.stringify(document.title))
  result = setFrontmatterValue(
    result,
    'description',
    JSON.stringify(`${document.displayPath} · ${labelForExt(document.ext)} · ${formatFileSize(document.sizeBytes)}`)
  )
  result = setFrontmatterValue(result, 'searchTitle', JSON.stringify(document.title))
  result = setFrontmatterValue(result, 'searchPath', JSON.stringify(document.displayPath))
  result = setFrontmatterValue(result, 'searchType', JSON.stringify(labelForExt(document.ext)))
  return `${result}${body}`
}

function disableGeneratedPageSearch(frontmatter) {
  let result = frontmatter || '---\n---\n'
  result = setFrontmatterValue(result, 'search', 'false')
  result = setFrontmatterValue(result, 'aside', 'false')
  result = setFrontmatterValue(result, 'pageClass', 'kb-wide-document')
  return result
}

function setFrontmatterValue(frontmatter, key, value) {
  const pattern = new RegExp(`^${key}\\s*:.*$`, 'm')
  if (pattern.test(frontmatter)) {
    return frontmatter.replace(pattern, `${key}: ${value}`)
  }

  return frontmatter.replace(/\r?\n---\r?\n$/, `\n${key}: ${value}\n---\n`)
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

async function loadZip(filePath) {
  return JSZip.loadAsync(await fs.readFile(filePath), {
    decodeFileName: (bytes) => new TextDecoder('gb18030').decode(bytes)
  })
}

function findZipEntry(archive, targetName) {
  const normalizedTarget = normalizeArchivePath(targetName).toLowerCase()
  return Object.values(archive.files).find(
    (entry) => normalizeArchivePath(entry.name).toLowerCase() === normalizedTarget
  )
}

function normalizeArchivePath(value) {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '')
}

function archiveExtension(fileName) {
  const extension = path.posix.extname(normalizeArchivePath(fileName)).toLowerCase()
  return extension ? extension.slice(1).toUpperCase() : '无扩展名'
}

function isArchiveTextCandidate(fileName) {
  const normalizedName = normalizeArchivePath(fileName)
  const baseName = path.posix.basename(normalizedName).toLowerCase()
  const extension = path.posix.extname(normalizedName).toLowerCase()
  return archiveTextExtensions.has(extension) || archiveTextNames.has(baseName)
}

function archivePreviewScore(fileName) {
  const normalizedName = normalizeArchivePath(fileName)
  const baseName = path.posix.basename(normalizedName).toLowerCase()
  const extension = path.posix.extname(normalizedName).toLowerCase()
  const depth = normalizedName.split('/').length

  if (baseName.startsWith('readme')) return depth
  if (extension === '.md' || extension === '.txt') return 10 + depth
  if (baseName === 'license') return 16 + depth
  if (['.c', '.h', '.cpp', '.hpp', '.ino', '.py'].includes(extension)) return 20 + depth
  if (['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg'].includes(extension)) return 30 + depth
  return 40 + depth
}

function looksBinary(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192))
  if (sample.includes(0)) return true

  let controlCharacters = 0
  for (const byte of sample) {
    const isAllowedWhitespace = byte === 9 || byte === 10 || byte === 12 || byte === 13
    if ((byte < 32 && !isAllowedWhitespace) || byte === 127) {
      controlCharacters += 1
    }
  }

  return sample.length > 0 && controlCharacters / sample.length > 0.08
}

function decodeTextBuffer(buffer) {
  try {
    return stripBom(new TextDecoder('utf-8', { fatal: true }).decode(buffer))
  } catch {
    return stripBom(new TextDecoder('gb18030').decode(buffer))
  }
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
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeVueText(value) {
  return escapeHtml(value)
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
}

function serializeForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
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
