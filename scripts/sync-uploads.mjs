import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TextDecoder } from 'node:util'
import JSZip from 'jszip'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import {
  assertArchiveEntrySize,
  assertFileSize,
  inspectArchive,
  isIgnoredUpload,
  renderSafeMarkdown,
  sanitizeGeneratedHtml,
  uploadLimits,
  validateUploadPath
} from './lib/content-guards.mjs'

const scriptPath = fileURLToPath(import.meta.url)
const __dirname = path.dirname(scriptPath)
const rootDir = path.resolve(__dirname, '..')
const uploadsDir = path.join(rootDir, 'uploads')
const generatedDir = path.join(rootDir, 'docs', 'library', 'generated')
const publicUploadsDir = path.join(rootDir, 'docs', 'public', 'uploads')
const rawUploadsDir = path.join(publicUploadsDir, 'raw')
const previewUploadsDir = path.join(publicUploadsDir, 'previews')
const pdfPreviewDir = path.join(previewUploadsDir, 'pdf')
const pdfPreviewCacheDir = path.join(rootDir, '.cache', 'pdf-previews')
const libraryIndexPath = path.join(rootDir, 'docs', 'library', 'index.md')
const libraryCategoriesPath = path.join(rootDir, 'config', 'library-categories.json')
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
const maxArchivePreviewFiles = 6
const maxArchivePreviewFileBytes = 24 * 1024
const maxArchivePreviewTotalBytes = 48 * 1024
const maxArchivePreviewCharacters = 16000
const maxSpreadsheetPreviewRows = 24
const maxSpreadsheetPreviewColumns = 24
const pdfPreviewConcurrency = 4

const supportedDocuments = new Set([
  '.md', '.markdown', '.pdf', '.docx', '.doc',
  '.zip', '.rar', '.7z', '.ppt', '.pptx',
  '.xls', '.xlsx', '.xmind', '.chm', '.txt', '.csv'
])

async function main() {
  console.log('Preparing generated document directories...')
  const libraryConfig = await loadLibraryConfig()
  const categoryBySourceFolder = new Map(
    libraryConfig.categories.flatMap((category) => (
      category.sourceFolders.map((folder) => [folder, category.name])
    ))
  )
  const allowedSourceFolders = new Set(categoryBySourceFolder.keys())
  await fs.mkdir(uploadsDir, { recursive: true })
  await fs.rm(generatedDir, { recursive: true, force: true })
  await fs.mkdir(generatedDir, { recursive: true })
  await fs.mkdir(rawUploadsDir, { recursive: true })
  await fs.mkdir(previewUploadsDir, { recursive: true })

  const files = await walk(uploadsDir, true)
  const uploadFiles = files
    .map((filePath) => toPosix(path.relative(uploadsDir, filePath)))
    .filter((relativePath) => !isIgnoredUpload(relativePath))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))

  const uploadFileSet = new Set(uploadFiles)
  const uploadStats = new Map(await Promise.all(uploadFiles.map(async (relativePath) => {
    validateUploadPath(relativePath, allowedSourceFolders, supportedDocuments)
    const stats = await fs.stat(path.join(uploadsDir, ...relativePath.split('/')))
    assertFileSize(relativePath, stats.size)
    return [relativePath, stats]
  })))
  const documents = await Promise.all(
    uploadFiles
      .filter((relativePath) => supportedDocuments.has(path.extname(relativePath).toLowerCase()))
      .map(async (relativePath) => createDocumentRecord(
        relativePath,
        uploadStats.get(relativePath).size,
        categoryBySourceFolder
      ))
  )

  const documentByRelativePath = new Map(documents.map((document) => [document.relativePath, document]))

  console.log(`Copying ${uploadFiles.length} source file(s)...`)
  let copiedCount = 0
  for (const relativePath of uploadFiles) {
    copiedCount += await copyRawUpload(relativePath, uploadStats.get(relativePath)) ? 1 : 0
  }
  await removeStaleRawUploads(uploadFileSet)
  await removeStalePreviews(documents)
  console.log(`Copied ${copiedCount} changed source file(s); ${uploadFiles.length - copiedCount} unchanged.`)

  await preparePdfPreviews(documents)

  console.log(`Generating ${documents.length} document page(s)...`)
  for (const document of documents) {
    if (['.zip', '.xmind', '.xls', '.xlsx', '.csv'].includes(document.ext)) {
      console.log(`  Previewing ${document.relativePath}`)
    }
    await writeGeneratedDocument(document, documentByRelativePath, uploadFileSet)
  }

  const categories = libraryConfig.categories.map((category) => category.name)
  await writeLibraryIndex(documents, categories)
  console.log(`Synced ${documents.length} document(s) from uploads/.`)
}

async function loadLibraryConfig() {
  const config = JSON.parse(await fs.readFile(libraryCategoriesPath, 'utf8'))
  if (!Array.isArray(config.categories) || config.categories.length === 0) {
    throw new Error('config/library-categories.json 必须至少配置一个分类')
  }

  const names = new Set()
  const sourceFolders = new Set()
  for (const category of config.categories) {
    if (!category?.name || !Array.isArray(category.sourceFolders) || category.sourceFolders.length === 0) {
      throw new Error('每个资料分类都必须包含 name 和 sourceFolders')
    }
    if (names.has(category.name)) throw new Error(`资料分类重复：${category.name}`)
    names.add(category.name)
    for (const folder of category.sourceFolders) {
      if (!folder || folder.includes('/') || folder.startsWith('.')) {
        throw new Error(`资料源目录名称无效：${folder}`)
      }
      if (sourceFolders.has(folder)) throw new Error(`资料源目录重复：${folder}`)
      sourceFolders.add(folder)
    }
  }
  return config
}

async function walk(dir, skipHidden = false) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const results = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))) {
    if (skipHidden && entry.name.startsWith('.')) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await walk(fullPath, skipHidden))
    } else if (entry.isFile()) {
      results.push(fullPath)
    }
  }

  return results
}

function createDocumentRecord(relativePath, sizeBytes, categoryBySourceFolder) {
  const ext = path.extname(relativePath).toLowerCase()
  const title = titleFromPath(relativePath)
  const id = `doc-${crypto.createHash('sha1').update(relativePath).digest('hex').slice(0, 10)}`
  const pathParts = relativePath.split('/')
  const firstFolder = pathParts[0]
  const category = categoryBySourceFolder.get(firstFolder)
  const sectionParts = pathParts.slice(1, -1)

  return {
    id,
    title,
    category,
    sectionParts,
    displayPath: [category, ...sectionParts.map(displaySectionName)].join(' / '),
    relativePath,
    ext,
    sizeBytes,
    sourcePath: path.join(uploadsDir, ...relativePath.split('/')),
    pagePath: path.join(generatedDir, `${id}.md`),
    pageLink: `/library/generated/${id}`,
    publicUrl: `/uploads/raw/${encodePath(relativePath)}`,
    previewUrl: null
  }
}

async function copyRawUpload(relativePath, sourceStats) {
  const sourcePath = path.join(uploadsDir, ...relativePath.split('/'))
  const targetPath = path.join(rawUploadsDir, ...relativePath.split('/'))
  try {
    const targetStats = await fs.stat(targetPath)
    if (
      targetStats.size === sourceStats.size &&
      Math.abs(targetStats.mtimeMs - sourceStats.mtimeMs) < 2
    ) return false
  } catch {}

  await fs.mkdir(path.dirname(targetPath), { recursive: true })
  await fs.copyFile(sourcePath, targetPath)
  await fs.utimes(targetPath, sourceStats.atime, sourceStats.mtime)
  return true
}

async function removeStaleRawUploads(uploadFileSet) {
  if (!await fileExists(rawUploadsDir)) return
  const publicFiles = await walk(rawUploadsDir)
  for (const filePath of publicFiles) {
    const relativePath = toPosix(path.relative(rawUploadsDir, filePath))
    if (!uploadFileSet.has(relativePath)) await fs.rm(filePath, { force: true })
  }
}

async function removeStalePreviews(documents) {
  const previewDocumentIds = new Set(
    documents
      .filter((document) => document.ext === '.docx' || document.ext === '.xmind')
      .map((document) => document.id)
  )
  const pdfDocumentIds = new Set(
    documents.filter((document) => document.ext === '.pdf').map((document) => document.id)
  )

  for (const entry of await fs.readdir(previewUploadsDir, { withFileTypes: true })) {
    if (entry.name === 'pdf') continue
    if (!previewDocumentIds.has(entry.name)) {
      await fs.rm(path.join(previewUploadsDir, entry.name), { recursive: true, force: true })
    }
  }

  if (!await fileExists(pdfPreviewDir)) return
  for (const entry of await fs.readdir(pdfPreviewDir, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.jpg') continue
    if (!pdfDocumentIds.has(path.basename(entry.name, path.extname(entry.name)))) {
      await fs.rm(path.join(pdfPreviewDir, entry.name), { force: true })
    }
  }
}

async function preparePdfPreviews(documents) {
  const pdfDocuments = documents.filter((document) => document.ext === '.pdf')
  if (pdfDocuments.length === 0) return

  if (!await commandIsAvailable('pdftoppm', ['-v'])) {
    console.warn('Skipping PDF cover previews because pdftoppm is unavailable.')
    return
  }

  await fs.mkdir(pdfPreviewDir, { recursive: true })
  await fs.mkdir(pdfPreviewCacheDir, { recursive: true })
  console.log(`Preparing ${pdfDocuments.length} PDF first-page preview(s)...`)

  let nextIndex = 0
  let generatedCount = 0
  let cachedCount = 0
  let failedCount = 0

  async function worker() {
    while (nextIndex < pdfDocuments.length) {
      const document = pdfDocuments[nextIndex]
      nextIndex += 1

      try {
        const result = await preparePdfPreview(document)
        generatedCount += result.generated ? 1 : 0
        cachedCount += result.generated ? 0 : 1
      } catch (error) {
        failedCount += 1
        console.warn(`  Unable to preview ${document.relativePath}: ${error.message}`)
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(pdfPreviewConcurrency, pdfDocuments.length) },
      () => worker()
    )
  )

  const summary = [`${generatedCount} generated`, `${cachedCount} cached`]
  if (failedCount > 0) summary.push(`${failedCount} skipped`)
  console.log(`Prepared PDF previews (${summary.join(', ')}).`)
}

async function preparePdfPreview(document) {
  const fingerprint = await pdfPreviewFingerprint(document)
  const cachePath = path.join(pdfPreviewCacheDir, `${document.id}-${fingerprint}.jpg`)
  const outputPath = path.join(pdfPreviewDir, `${document.id}.jpg`)
  const generated = !await fileExists(cachePath)

  if (generated) {
    const temporaryPrefix = path.join(
      pdfPreviewCacheDir,
      `.${document.id}-${process.pid}-${crypto.randomBytes(4).toString('hex')}`
    )
    const temporaryPath = `${temporaryPrefix}.jpg`

    try {
      await runCommand('pdftoppm', [
        '-f', '1',
        '-l', '1',
        '-singlefile',
        '-jpeg',
        '-jpegopt', 'quality=72,progressive=y,optimize=y',
        '-scale-to', '1280',
        document.sourcePath,
        temporaryPrefix
      ])
      await fs.rename(temporaryPath, cachePath)
    } finally {
      await fs.rm(temporaryPath, { force: true })
    }
  }

  await fs.copyFile(cachePath, outputPath)
  document.previewUrl = `/uploads/previews/pdf/${document.id}.jpg`
  return { generated }
}

async function pdfPreviewFingerprint(document) {
  const sampleSize = Math.min(document.sizeBytes, 64 * 1024)
  const source = await fs.open(document.sourcePath, 'r')
  const hash = crypto.createHash('sha1').update(String(document.sizeBytes))

  try {
    const head = Buffer.alloc(sampleSize)
    const { bytesRead: headBytes } = await source.read(head, 0, sampleSize, 0)
    hash.update(head.subarray(0, headBytes))

    if (document.sizeBytes > sampleSize) {
      const tail = Buffer.alloc(sampleSize)
      const tailPosition = Math.max(0, document.sizeBytes - sampleSize)
      const { bytesRead: tailBytes } = await source.read(tail, 0, sampleSize, tailPosition)
      hash.update(tail.subarray(0, tailBytes))
    }
  } finally {
    await source.close()
  }

  return hash.digest('hex').slice(0, 12)
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function commandIsAvailable(command, args) {
  try {
    await runCommand(command, args)
    return true
  } catch {
    return false
  }
}

function runCommand(command, args, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'ignore', 'pipe']
    })
    let stderr = ''
    let settled = false
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill('SIGKILL')
      reject(new Error(`${command} 执行超过 ${Math.round(timeoutMs / 1000)} 秒，已停止`))
    }, timeoutMs)

    child.stderr.on('data', (chunk) => {
      if (stderr.length < 4096) stderr += chunk.toString()
    })
    child.on('error', (error) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', (code) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(stderr.trim() || `${command} exited with code ${code}`))
      }
    })
  })
}

async function writeGeneratedDocument(document, documentByRelativePath, uploadFileSet) {
  let page

  try {
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
  } catch (error) {
    console.warn(`  Unable to create a rich preview for ${document.relativePath}: ${error.message}`)
    page = renderDownloadPage(document, '此资料暂时不能安全地转换为网页预览，请下载原始文件查看。')
  }

  page = addGeneratedPageMetadata(page, document)
  await fs.writeFile(document.pagePath, page, 'utf8')
}

async function renderMarkdownPage(document, documentByRelativePath, uploadFileSet) {
  assertFileSize(document.relativePath, document.sizeBytes, uploadLimits.maxMarkdownBytes)
  const source = stripBom(await fs.readFile(document.sourcePath, 'utf8'))
  const { body } = splitFrontmatter(source)
  const markdownBody = `${/^#\s+.+$/m.test(body) ? '' : `# ${document.title}\n\n`}${body.trimStart()}`
  const previewHtml = renderSafeMarkdown(markdownBody, {
    currentRelativePath: document.relativePath,
    documentByRelativePath,
    uploadFileSet
  })

  return `${disableGeneratedPageSearch('')}${previewHtml}\n`
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
${document.previewUrl ? `const previewUrl = withBase(${JSON.stringify(document.previewUrl)})` : ''}
</script>

# ${document.title}

${renderFileMeta(document)}

<p class="kb-download-actions">
  <a class="kb-download-button" :href="fileUrl" target="_blank" rel="noopener">新窗口大屏阅读</a>
  <a class="kb-download-button kb-download-button-secondary" :href="fileUrl" download>下载 PDF</a>
</p>

<PdfPreview
  :src="fileUrl"
  ${document.previewUrl ? ':preview-src="previewUrl"' : ''}
  title="${escapeHtml(document.title)}"
  size="${escapeHtml(formatFileSize(document.sizeBytes))}"
  :size-bytes="${document.sizeBytes}"
/>
`
}

async function renderDocxPage(document) {
  try {
    await loadZip(document.sourcePath, document.relativePath)
    const documentPreviewDir = path.join(previewUploadsDir, document.id)
    let imageIndex = 0
    await fs.rm(documentPreviewDir, { recursive: true, force: true })
    await fs.mkdir(documentPreviewDir, { recursive: true })

    const result = await mammoth.convertToHtml(
      { path: document.sourcePath },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const imageBuffer = await image.readAsBuffer()
          if (imageBuffer.byteLength > uploadLimits.maxXMindThumbnailBytes) {
            throw new Error('文档中的单张图片超过预览上限')
          }
          const imageExtension = extensionForImage(image.contentType)
          if (!imageExtension) throw new Error(`不支持的内嵌图片格式：${image.contentType}`)
          const imageName = `image-${String(++imageIndex).padStart(3, '0')}.${imageExtension}`
          await fs.writeFile(path.join(documentPreviewDir, imageName), imageBuffer)
          return {
            src: `__KB_WITH_BASE__/uploads/previews/${document.id}/${encodeURIComponent(imageName)}`
          }
        })
      }
    )
    const previewHtml = sanitizeGeneratedHtml(result.value, { allowRelativeLinks: false })
      .replace(
        /src="__KB_WITH_BASE__([^"]+)"/g,
        (_, imageUrl) => `:src="withBase('${imageUrl}')"`
      )
      .replace(/<img\b/g, '<img loading="lazy" decoding="async"')

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
    console.warn(`  Unable to convert ${document.relativePath}: ${error.message}`)
    return renderLegacyDocPage(document, '此 Word 文件暂时无法转换为网页内容。')
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
  assertFileSize(document.relativePath, document.sizeBytes, uploadLimits.maxSpreadsheetBytes)
  if (document.ext === '.xlsx') await loadZip(document.sourcePath, document.relativePath)
  const workbook = XLSX.read(await fs.readFile(document.sourcePath), {
    type: 'buffer',
    cellDates: true
  })
  if (workbook.SheetNames.length > uploadLimits.maxSpreadsheetSheets) {
    throw new Error(`工作簿包含超过 ${uploadLimits.maxSpreadsheetSheets} 个工作表`)
  }
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
  const totalRows = sheets.reduce((sum, sheet) => sum + sheet.totalRows, 0)
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
      totalRows: 0,
      totalColumns: 0,
      nonEmptyCells: 0,
      truncated: false
    }
  }

  const cellAddresses = Object.keys(sheet).filter((key) => !key.startsWith('!'))
  if (cellAddresses.length > uploadLimits.maxSpreadsheetCells) {
    throw new Error(`工作表包含超过 ${uploadLimits.maxSpreadsheetCells} 个单元格`)
  }

  const populatedCells = []
  const populatedRows = new Set()
  let firstColumn = Number.POSITIVE_INFINITY
  let lastColumn = -1

  for (const address of cellAddresses) {
    let position
    try {
      position = XLSX.utils.decode_cell(address)
    } catch {
      continue
    }
    const value = XLSX.utils.format_cell(sheet[address])
    if (String(value).trim() === '') continue
    populatedCells.push({ ...position, value })
    populatedRows.add(position.r)
    firstColumn = Math.min(firstColumn, position.c)
    lastColumn = Math.max(lastColumn, position.c)
  }

  if (populatedCells.length === 0) {
    return {
      firstColumn: 0,
      columnCount: 0,
      rows: [],
      totalRows: 0,
      totalColumns: 0,
      nonEmptyCells: 0,
      truncated: false
    }
  }

  const previewEndColumn = Math.min(
    lastColumn,
    firstColumn + maxSpreadsheetPreviewColumns - 1
  )
  const previewableRows = new Set(
    populatedCells.filter((cell) => cell.c <= previewEndColumn).map((cell) => cell.r)
  )
  const selectedRowNumbers = [...previewableRows]
    .sort((a, b) => a - b)
    .slice(0, maxSpreadsheetPreviewRows)
  const selectedRows = new Set(selectedRowNumbers)
  const valuesByRow = new Map(selectedRowNumbers.map((row) => [row, new Map()]))

  for (const cell of populatedCells) {
    if (selectedRows.has(cell.r) && cell.c <= previewEndColumn) {
      valuesByRow.get(cell.r).set(cell.c, cell.value)
    }
  }

  const rows = selectedRowNumbers.map((rowNumber) => {
    const cells = valuesByRow.get(rowNumber)
    const finalColumn = Math.max(...cells.keys())
    return {
      rowNumber: rowNumber + 1,
      values: Array.from(
        { length: finalColumn - firstColumn + 1 },
        (_, index) => cells.get(firstColumn + index) || ''
      )
    }
  })
  const columnCount = rows.reduce((count, row) => Math.max(count, row.values.length), 0)
  const totalRows = populatedRows.size
  const nonEmptyCells = populatedCells.length

  return {
    firstColumn,
    columnCount,
    rows,
    totalRows,
    totalColumns: lastColumn - firstColumn + 1,
    nonEmptyCells,
    truncated: totalRows > rows.length || lastColumn > previewEndColumn
  }
}

function renderSpreadsheetSheet(sheet, open) {
  const visibility = sheet.hiddenState === 2
    ? '（深度隐藏）'
    : sheet.hiddenState === 1
      ? '（隐藏）'
      : ''
  const summary = `${escapeVueText(sheet.name)}${visibility} · ${sheet.totalRows} 行 · ${sheet.nonEmptyCells} 个非空单元格`

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
  ${sheet.truncated ? `<p class="kb-preview-limit">网页展示前 ${maxSpreadsheetPreviewRows} 行、${maxSpreadsheetPreviewColumns} 列，完整内容请下载原始表格。</p>` : ''}
</details>`
}

async function renderXMindPage(document) {
  const archive = await loadZip(document.sourcePath, document.relativePath)
  const documentPreviewDir = path.join(previewUploadsDir, document.id)
  await fs.rm(documentPreviewDir, { recursive: true, force: true })
  const contentEntry = findZipEntry(archive, 'content.json')

  if (!contentEntry) {
    throw new Error(`${document.relativePath}: XMind 文件中缺少 content.json`)
  }

  assertArchiveEntrySize(contentEntry, uploadLimits.maxXMindContentBytes, 'XMind content.json')
  const contentBuffer = await contentEntry.async('nodebuffer')
  if (contentBuffer.byteLength > uploadLimits.maxXMindContentBytes) {
    throw new Error('XMind content.json 超过预览上限')
  }
  const parsedContent = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(contentBuffer))
  const sheets = normalizeXMindSheets(parsedContent)
  const topicCount = sheets.reduce((sum, sheet) => sum + countXMindTopics(sheet.rootTopic), 0)
  if (topicCount > uploadLimits.maxXMindTopics) {
    throw new Error(`XMind 主题数超过 ${uploadLimits.maxXMindTopics} 个的预览上限`)
  }
  const thumbnailEntry = findZipEntry(archive, 'Thumbnails/thumbnail.png')
  let thumbnailUrl = null

  if (thumbnailEntry) {
    assertArchiveEntrySize(thumbnailEntry, uploadLimits.maxXMindThumbnailBytes, 'XMind 缩略图')
    const thumbnail = await thumbnailEntry.async('nodebuffer')
    if (thumbnail.byteLength > uploadLimits.maxXMindThumbnailBytes) {
      throw new Error('XMind 缩略图超过预览上限')
    }
    await fs.mkdir(documentPreviewDir, { recursive: true })
    await fs.writeFile(
      path.join(documentPreviewDir, 'thumbnail.png'),
      thumbnail
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
    <img :src="thumbnailUrl" alt="${escapeHtml(document.title)} 思维导图缩略图" loading="lazy" decoding="async">
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
  let count = 0
  const pending = [{ topic, depth: 1 }]

  while (pending.length > 0) {
    const current = pending.pop()
    if (current.depth > uploadLimits.maxXMindDepth) {
      throw new Error(`XMind 主题层级超过 ${uploadLimits.maxXMindDepth} 层的预览上限`)
    }
    count += 1
    if (count > uploadLimits.maxXMindTopics) {
      throw new Error(`XMind 主题数超过 ${uploadLimits.maxXMindTopics} 个的预览上限`)
    }
    for (const child of xmindTopicChildren(current.topic)) {
      pending.push({ topic: child, depth: current.depth + 1 })
    }
  }

  return count
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
  const archive = await loadZip(document.sourcePath, document.relativePath)
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
    const truncated = decoded.length > maxArchivePreviewCharacters
    previews.push({
      name: file.name,
      sizeBytes: file.sizeBytes,
      content: truncated ? `${decoded.slice(0, maxArchivePreviewCharacters)}\n\n[网页预览到此处，完整内容请下载源码包查看。]` : decoded,
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
  const sourceFile = await fs.open(document.sourcePath, 'r')
  const previewLength = Math.min(document.sizeBytes, uploadLimits.maxTextPreviewBytes + 1)
  const previewBuffer = Buffer.alloc(previewLength)
  let bytesRead = 0
  try {
    const result = await sourceFile.read(previewBuffer, 0, previewLength, 0)
    bytesRead = result.bytesRead
  } finally {
    await sourceFile.close()
  }
  const truncated = document.sizeBytes > uploadLimits.maxTextPreviewBytes
  const decoded = decodeTextBuffer(
    previewBuffer.subarray(0, Math.min(bytesRead, uploadLimits.maxTextPreviewBytes))
  )
  const source = truncated
    ? `${decoded}\n\n[网页预览到此处，完整内容请下载原始文件查看。]`
    : decoded

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

function renderDownloadPage(document, note = '此文件提供原始格式下载。') {
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

${escapeVueText(note)}

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
    'image/bmp': 'bmp'
  }

  return extensions[contentType] || 'bin'
}

async function loadZip(filePath, relativePath) {
  const archiveBuffer = await fs.readFile(filePath)
  assertFileSize(relativePath, archiveBuffer.byteLength, uploadLimits.maxArchiveBytes)
  const archive = await JSZip.loadAsync(archiveBuffer, {
    decodeFileName: (bytes) => new TextDecoder('gb18030').decode(bytes)
  })
  inspectArchive(archive, archiveBuffer.byteLength, relativePath)
  return archive
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

export { countXMindTopics, main, spreadsheetTable }

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
