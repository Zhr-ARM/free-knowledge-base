import assert from 'node:assert/strict'
import test from 'node:test'
import {
  inspectArchive,
  isIgnoredUpload,
  renderSafeMarkdown,
  sanitizeGeneratedHtml,
  validateUploadPath
} from '../scripts/lib/content-guards.mjs'
import {
  countXMindTopics,
  parsePdfInfo,
  parseQpdfFirstPageEnd,
  spreadsheetTable
} from '../scripts/sync-uploads.mjs'

test('hidden files and every hidden path segment are ignored', () => {
  assert.equal(isIgnoredUpload('.secret.pdf'), true)
  assert.equal(isIgnoredUpload('嵌入式/.private/secret.pdf'), true)
  assert.equal(isIgnoredUpload('嵌入式/资料/.cache/file.pdf'), true)
  assert.equal(isIgnoredUpload('嵌入式/公开资料.pdf'), false)
})

test('upload paths stay inside configured categories and block executables', () => {
  const categories = new Set(['嵌入式'])
  const documents = new Set(['.pdf'])
  assert.doesNotThrow(() => validateUploadPath('嵌入式/手册.pdf', categories, documents))
  assert.throws(() => validateUploadPath('未知分类/手册.pdf', categories, documents), /未在/)
  assert.throws(() => validateUploadPath('嵌入式/工具.exe', categories, documents), /可执行/)
  assert.throws(() => validateUploadPath('嵌入式/网页.html', categories, documents), /未受支持/)
  assert.doesNotThrow(() => validateUploadPath('嵌入式/接线图.png', categories, documents))
})

test('Markdown is rendered without executable HTML or Vue expressions', () => {
  const targetPath = '嵌入式/课程/My Guide (v2).pdf'
  const html = renderSafeMarkdown(
    '[资料](<My Guide (v2).pdf>)\n\n<script>alert(1)</script>\n\n{{ secret }}\n\n[危险](javascript:alert(1))',
    {
      currentRelativePath: '嵌入式/课程/导览.md',
      documentByRelativePath: new Map([[targetPath, { id: 'doc-target' }]]),
      uploadFileSet: new Set([targetPath])
    }
  )

  assert.match(html, /href="\.\/doc-target"/)
  assert.doesNotMatch(html, /<script|href="javascript:|\{\{/i)
  assert.match(html, /&#123;&#123; secret &#125;&#125;/)
})

test('generated document HTML removes event handlers and unsafe URLs', () => {
  const html = sanitizeGeneratedHtml(
    '<p onclick="alert(1)">正文</p><a href="javascript:alert(1)">链接</a><img src="/safe.png" onerror="alert(1)"><script>alert(1)</script>'
  )

  assert.match(html, /<p>正文<\/p>/)
  assert.match(html, /<img src="\/safe.png"/)
  assert.doesNotMatch(html, /onclick|onerror|javascript:|<script/i)
})

test('archive inspection rejects traversal paths and abnormal expansion ratios', () => {
  assert.throws(() => inspectArchive({
    files: {
      bad: {
        name: 'safe.txt',
        unsafeOriginalName: '../secret.txt',
        _data: { uncompressedSize: 10 }
      }
    }
  }, 100, 'bad.zip'), /不安全路径/)

  assert.throws(() => inspectArchive({
    files: {
      bomb: {
        name: 'large.txt',
        _data: { uncompressedSize: 10 * 1024 * 1024 }
      }
    }
  }, 1024, 'bomb.zip'), /压缩率异常/)
})

test('spreadsheet preview scans actual cells instead of a declared giant range', () => {
  const result = spreadsheetTable({
    '!ref': 'A1:XFD1048576',
    A1: { t: 's', v: '安全预览' }
  })

  assert.equal(result.totalRows, 1)
  assert.equal(result.nonEmptyCells, 1)
  assert.deepEqual(result.rows[0].values, ['安全预览'])
})

test('XMind traversal enforces a maximum nesting depth', () => {
  let topic = { title: 'root' }
  const root = topic
  for (let index = 0; index < 60; index += 1) {
    const child = { title: `level-${index}` }
    topic.children = { attached: [child] }
    topic = child
  }

  assert.throws(() => countXMindTopics(root), /层级超过/)
})

test('PDF metadata exposes page count and web optimization state', () => {
  assert.deepEqual(parsePdfInfo([
    'Title:          C course',
    'Pages:          369',
    'Encrypted:      no',
    'Optimized:      yes',
    'PDF version:    1.7'
  ].join('\n')), {
    pageCount: 369,
    optimized: true,
    encrypted: false
  })

  assert.deepEqual(parsePdfInfo('Pages: 12\nOptimized: no\n'), {
    pageCount: 12,
    optimized: false,
    encrypted: false
  })

  assert.equal(parsePdfInfo('Pages: 20\nEncrypted: yes (print:no)\n').encrypted, true)

  assert.equal(parseQpdfFirstPageEnd('file_size: 1200\nfirst_page_end: 809281\nnpages: 20\n'), 809281)
  assert.equal(parseQpdfFirstPageEnd('not linearized'), 0)
})
