import path from 'node:path'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

export const uploadLimits = Object.freeze({
  maxFileBytes: 100 * 1024 * 1024,
  maxMarkdownBytes: 2 * 1024 * 1024,
  maxTextPreviewBytes: 256 * 1024,
  maxSpreadsheetBytes: 20 * 1024 * 1024,
  maxSpreadsheetSheets: 64,
  maxSpreadsheetCells: 100000,
  maxArchiveBytes: 64 * 1024 * 1024,
  maxArchiveEntries: 5000,
  maxArchiveEntryBytes: 96 * 1024 * 1024,
  maxArchiveExpandedBytes: 256 * 1024 * 1024,
  maxArchiveCompressionRatio: 200,
  maxXMindContentBytes: 8 * 1024 * 1024,
  maxXMindThumbnailBytes: 12 * 1024 * 1024,
  maxXMindTopics: 5000,
  maxXMindDepth: 48
})

const allowedDocumentTags = [
  'a', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup', 'dd', 'del',
  'details', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'li', 'ol', 'p', 'pre', 's',
  'small', 'span', 'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td',
  'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
]

const allowedDocumentAttributes = {
  a: ['href', 'name', 'rel', 'target', 'title'],
  code: ['class'],
  col: ['span'],
  details: ['open'],
  img: ['alt', 'height', 'loading', 'decoding', 'src', 'title', 'width'],
  ol: ['start', 'type'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan', 'scope'],
  li: ['value']
}

export function isIgnoredUpload(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/')
  const parts = normalized.split('/').filter(Boolean)
  return parts.some((part) => part.startsWith('.')) || normalized === 'README.md'
}

export function validateUploadPath(relativePath, allowedSourceFolders, supportedDocuments) {
  const normalized = relativePath.replace(/\\/g, '/')
  const parts = normalized.split('/').filter(Boolean)

  if (parts.length < 2 || normalized.startsWith('/') || parts.includes('..')) {
    throw new Error(`${relativePath}: 资料必须位于已配置的分类目录内`)
  }
  if (parts.some((part) => part.startsWith('.'))) {
    throw new Error(`${relativePath}: 隐藏目录或隐藏文件不会发布`)
  }
  if (!allowedSourceFolders.has(parts[0])) {
    throw new Error(`${relativePath}: 顶层分类“${parts[0]}”未在 config/library-categories.json 中配置`)
  }

  const extension = path.posix.extname(normalized).toLowerCase()
  if (supportedDocuments.has(extension)) return

  // Passive image attachments may be referenced by Markdown. Everything else needs an explicit
  // document renderer so active same-origin files cannot bypass sanitization.
  const allowedAttachments = new Set([
    '.avif', '.bmp', '.gif', '.jpeg', '.jpg', '.png', '.webp'
  ])
  if (!allowedAttachments.has(extension)) {
    throw new Error(`${relativePath}: 不允许发布未受支持或可执行的文件类型`)
  }
}

export function assertFileSize(relativePath, sizeBytes, limit = uploadLimits.maxFileBytes) {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0 || sizeBytes > limit) {
    throw new Error(`${relativePath}: 文件大小超过 ${formatLimit(limit)} 的安全上限`)
  }
}

export function renderSafeMarkdown(source, options) {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false
  })
  const defaultLinkOpen = markdown.renderer.rules.link_open || renderToken
  const defaultImage = markdown.renderer.rules.image || renderToken

  markdown.renderer.rules.link_open = (tokens, index, rendererOptions, env, self) => {
    const token = tokens[index]
    const href = token.attrGet('href')
    if (href) {
      const rewritten = rewriteUploadHref(href, options, false)
      token.attrSet('href', rewritten)
      if (/^https?:\/\//i.test(rewritten)) {
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener noreferrer')
      }
    }
    return defaultLinkOpen(tokens, index, rendererOptions, env, self)
  }

  markdown.renderer.rules.image = (tokens, index, rendererOptions, env, self) => {
    const token = tokens[index]
    const sourceUrl = token.attrGet('src')
    if (sourceUrl) token.attrSet('src', rewriteUploadHref(sourceUrl, options, true))
    token.attrSet('loading', 'lazy')
    token.attrSet('decoding', 'async')
    return defaultImage(tokens, index, rendererOptions, env, self)
  }

  return sanitizeGeneratedHtml(markdown.render(source))
}

export function sanitizeGeneratedHtml(source, options = {}) {
  const sanitized = sanitizeHtml(source, {
    allowedTags: allowedDocumentTags,
    allowedAttributes: allowedDocumentAttributes,
    allowedClasses: {
      code: ['language-*']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    enforceHtmlBoundary: true,
    transformTags: {
      a: (tagName, attributes) => {
        if (
          options.allowRelativeLinks === false &&
          attributes.href &&
          !/^(?:https?:|mailto:|#)/i.test(attributes.href)
        ) {
          delete attributes.href
          delete attributes.target
          delete attributes.rel
        }
        if (/^https?:\/\//i.test(attributes.href || '')) {
          attributes.target = '_blank'
          attributes.rel = 'noopener noreferrer'
        }
        if (attributes.target === '_blank') {
          attributes.rel = 'noopener noreferrer'
        }
        return { tagName, attribs: attributes }
      }
    }
  })

  // Vue treats braces in generated HTML text as template expressions.
  return sanitized
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
}

export function inspectArchive(archive, compressedBytes, relativePath = '压缩文件') {
  const entries = Object.values(archive.files)
  if (entries.length > uploadLimits.maxArchiveEntries) {
    throw new Error(`${relativePath}: 压缩包包含 ${entries.length} 个条目，超过 ${uploadLimits.maxArchiveEntries} 个的上限`)
  }

  let expandedBytes = 0
  for (const entry of entries) {
    const originalName = String(entry.unsafeOriginalName || entry.name || '')
    const normalizedName = originalName.replace(/\\/g, '/')
    const parts = normalizedName.split('/')
    if (
      normalizedName.startsWith('/') ||
      /^[a-z]:\//i.test(normalizedName) ||
      parts.includes('..') ||
      normalizedName.includes('\0')
    ) {
      throw new Error(`${relativePath}: 压缩包包含不安全路径`)
    }
    if (normalizedName.length > 512) {
      throw new Error(`${relativePath}: 压缩包内路径长度超过 512 个字符`)
    }

    const entryBytes = Number(entry._data?.uncompressedSize || 0)
    if (entryBytes > uploadLimits.maxArchiveEntryBytes) {
      throw new Error(`${relativePath}: 单个压缩条目超过 ${formatLimit(uploadLimits.maxArchiveEntryBytes)}`)
    }
    expandedBytes += entryBytes
    if (expandedBytes > uploadLimits.maxArchiveExpandedBytes) {
      throw new Error(`${relativePath}: 解压后大小超过 ${formatLimit(uploadLimits.maxArchiveExpandedBytes)}`)
    }
  }

  const ratio = expandedBytes / Math.max(1, compressedBytes)
  if (ratio > uploadLimits.maxArchiveCompressionRatio) {
    throw new Error(`${relativePath}: 压缩率异常，已停止生成在线预览`)
  }

  return { entries, expandedBytes, ratio }
}

export function assertArchiveEntrySize(entry, limit, label) {
  const sizeBytes = Number(entry?._data?.uncompressedSize || 0)
  if (sizeBytes > limit) {
    throw new Error(`${label} 超过 ${formatLimit(limit)} 的预览上限`)
  }
}

function rewriteUploadHref(href, options, image) {
  if (/^(?:[a-z][a-z\d+.-]*:|#|\/)/i.test(href)) return href

  const match = href.match(/^([^?#]*)([?#][\s\S]*)?$/)
  const pathname = match?.[1] || href
  const suffix = match?.[2] || ''
  const decodedPath = safeDecodeURIComponent(pathname)
  const targetPath = path.posix.normalize(
    path.posix.join(path.posix.dirname(options.currentRelativePath), decodedPath)
  ).replace(/^\.\//, '')

  if (targetPath === '..' || targetPath.startsWith('../')) return href

  if (!image && options.documentByRelativePath.has(targetPath)) {
    const document = options.documentByRelativePath.get(targetPath)
    return `./${document.id}${suffix}`
  }
  if (options.uploadFileSet.has(targetPath)) {
    return `../../uploads/raw/${encodePath(targetPath)}${suffix}`
  }
  return href
}

function renderToken(tokens, index, options, _env, self) {
  return self.renderToken(tokens, index, options)
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function encodePath(relativePath) {
  return relativePath.split('/').map(encodeURIComponent).join('/')
}

function formatLimit(sizeBytes) {
  return `${Math.round(sizeBytes / 1024 / 1024)} MB`
}
