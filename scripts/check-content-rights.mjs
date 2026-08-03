import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isIgnoredUpload } from './lib/content-guards.mjs'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const uploadsDir = path.join(rootDir, 'uploads')
const manifestPath = path.join(rootDir, 'content-rights.json')
const updateManifest = process.argv.includes('--update')
const validStatuses = new Set(['approved', 'pending-review', 'restricted'])

async function main() {
  const manifest = await readManifest()
  const sourceFiles = (await walk(uploadsDir))
    .map((filePath) => toPosix(path.relative(uploadsDir, filePath)))
    .filter((relativePath) => !isIgnoredUpload(relativePath))
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))
  const sourceFileSet = new Set(sourceFiles)
  const errors = []
  let pendingCount = 0

  for (const relativePath of sourceFiles) {
    const digest = await sha256(path.join(uploadsDir, ...relativePath.split('/')))
    let record = manifest.documents[relativePath]

    if (!record && updateManifest) {
      record = {
        sha256: digest,
        status: 'pending-review',
        sourceUrl: '',
        rightsHolder: '',
        redistributionBasis: '',
        reviewedAt: ''
      }
      manifest.documents[relativePath] = record
    }

    if (!record) {
      errors.push(`${relativePath}: 缺少版权与来源记录`)
      continue
    }
    if (updateManifest) record.sha256 = digest
    if (record.sha256 !== digest) {
      errors.push(`${relativePath}: 文件内容已变化，请审核后更新版权清单`)
    }
    if (!validStatuses.has(record.status)) {
      errors.push(`${relativePath}: 未知审核状态“${record.status}”`)
    } else if (record.status === 'restricted') {
      errors.push(`${relativePath}: 已标记为 restricted，不能公开发布`)
    } else if (record.status === 'approved') {
      if (!record.rightsHolder || !record.redistributionBasis || !record.reviewedAt) {
        errors.push(`${relativePath}: approved 记录缺少权利方、再分发依据或审核日期`)
      }
    } else {
      pendingCount += 1
    }
  }

  for (const relativePath of Object.keys(manifest.documents)) {
    if (!sourceFileSet.has(relativePath)) delete manifest.documents[relativePath]
  }

  if (updateManifest) {
    manifest.documents = Object.fromEntries(
      Object.entries(manifest.documents).sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
    )
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    console.log(`Updated content rights inventory for ${sourceFiles.length} public file(s).`)
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`)
    throw new Error(`Content rights check failed with ${errors.length} error(s).`)
  }

  console.log(`Content rights inventory covers ${sourceFiles.length} public file(s); ${pendingCount} pending review.`)
}

async function readManifest() {
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
    if (manifest.version !== 1 || !manifest.documents || typeof manifest.documents !== 'object') {
      throw new Error('content-rights.json 格式无效')
    }
    return manifest
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    if (!updateManifest) throw new Error('缺少 content-rights.json，请先建立资料版权清单')
    return { version: 1, documents: {} }
  }
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

async function sha256(filePath) {
  const hash = crypto.createHash('sha256')
  const handle = await fs.open(filePath, 'r')
  try {
    for await (const chunk of handle.createReadStream()) hash.update(chunk)
  } finally {
    await handle.close().catch(() => {})
  }
  return hash.digest('hex')
}

function toPosix(value) {
  return value.split(path.sep).join('/')
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
