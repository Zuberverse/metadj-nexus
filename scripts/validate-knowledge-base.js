#!/usr/bin/env node

/**
 * Knowledge Base Freshness Validator
 *
 * Validates that MetaDJai knowledge base files are current and consistent.
 * Checks:
 * 1. All knowledge files have recent lastUpdated timestamps
 * 2. Entry counts and structure are valid
 * 3. Required keywords exist for searchability
 *
 * Usage: node scripts/validate-knowledge-base.js [--strict]
 *   --strict: Fail if any file is older than 7 days
 */

const fs = require('fs')
const path = require('path')

const KNOWLEDGE_DIR = path.join(__dirname, '../src/data/knowledge')
const STALENESS_THRESHOLD_DAYS = 7
const REQUIRED_CATEGORIES = [
  'identity',
  'metadj',
  'philosophy',
  'workflows',
  'zuberant',
  'zuberverse',
]

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function getDaysSince(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function validateKnowledgeFile(filePath) {
  const fileName = path.basename(filePath)
  const issues = []
  const warnings = []

  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(content)

    // Check _meta block exists
    if (!data._meta) {
      issues.push('Missing _meta block')
    } else {
      // Check lastUpdated
      if (!data._meta.lastUpdated) {
        issues.push('Missing _meta.lastUpdated')
      } else {
        const daysSince = getDaysSince(data._meta.lastUpdated)
        if (daysSince > STALENESS_THRESHOLD_DAYS) {
          warnings.push(
            `lastUpdated is ${daysSince} days old (${data._meta.lastUpdated})`
          )
        }
      }

      // Check source
      if (!data._meta.source) {
        warnings.push('Missing _meta.source')
      }
    }

    // Check category
    if (!data.category) {
      issues.push('Missing category field')
    }

    // Check entries
    if (!data.entries || !Array.isArray(data.entries)) {
      issues.push('Missing or invalid entries array')
    } else {
      // Validate each entry
      data.entries.forEach((entry, index) => {
        if (!entry.id) {
          issues.push(`Entry ${index}: Missing id`)
        }
        if (!entry.title) {
          issues.push(`Entry ${index}: Missing title`)
        }
        if (!entry.content) {
          issues.push(`Entry ${index}: Missing content`)
        }
        if (!entry.keywords || entry.keywords.length === 0) {
          warnings.push(`Entry "${entry.id || index}": No keywords defined`)
        }
        if (entry.content && entry.content.length < 100) {
          warnings.push(
            `Entry "${entry.id || index}": Content is short (${entry.content.length} chars)`
          )
        }
      })
    }

    return {
      fileName,
      category: data.category,
      entryCount: data.entries?.length || 0,
      lastUpdated: data._meta?.lastUpdated,
      daysSinceUpdate: data._meta?.lastUpdated
        ? getDaysSince(data._meta.lastUpdated)
        : null,
      issues,
      warnings,
      valid: issues.length === 0,
    }
  } catch (error) {
    return {
      fileName,
      issues: [`Parse error: ${error.message}`],
      warnings: [],
      valid: false,
    }
  }
}

function main() {
  const strictMode = process.argv.includes('--strict')

  log('\n📚 MetaDJai Knowledge Base Validator\n', 'cyan')
  log('=' + '='.repeat(50), 'dim')

  // Get all JSON files in knowledge directory
  const files = fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(KNOWLEDGE_DIR, f))

  const results = files.map(validateKnowledgeFile)
  const foundCategories = results.map((r) => r.category).filter(Boolean)

  // Check for missing required categories
  const missingCategories = REQUIRED_CATEGORIES.filter(
    (cat) => !foundCategories.includes(cat)
  )

  // Display results
  let hasErrors = false
  let hasWarnings = false

  results.forEach((result) => {
    const statusIcon = result.valid
      ? result.warnings.length > 0
        ? '⚠️ '
        : '✅'
      : '❌'

    log(`\n${statusIcon} ${result.fileName}`, result.valid ? 'green' : 'red')

    if (result.category) {
      log(`   Category: ${result.category}`, 'dim')
    }
    if (result.entryCount) {
      log(`   Entries: ${result.entryCount}`, 'dim')
    }
    if (result.lastUpdated) {
      const freshness =
        result.daysSinceUpdate <= STALENESS_THRESHOLD_DAYS ? 'fresh' : 'stale'
      const color = freshness === 'fresh' ? 'green' : 'yellow'
      log(
        `   Last Updated: ${result.lastUpdated} (${result.daysSinceUpdate} days ago - ${freshness})`,
        color
      )
    }

    if (result.issues.length > 0) {
      hasErrors = true
      result.issues.forEach((issue) => {
        log(`   ❌ ${issue}`, 'red')
      })
    }

    if (result.warnings.length > 0) {
      hasWarnings = true
      result.warnings.forEach((warning) => {
        log(`   ⚠️  ${warning}`, 'yellow')
      })
    }
  })

  // Missing categories
  if (missingCategories.length > 0) {
    log('\n❌ Missing Required Categories:', 'red')
    missingCategories.forEach((cat) => {
      log(`   - ${cat}.json`, 'red')
    })
    hasErrors = true
  }

  // Summary
  log('\n' + '=' + '='.repeat(50), 'dim')
  const validCount = results.filter((r) => r.valid).length
  const totalEntries = results.reduce((sum, r) => sum + (r.entryCount || 0), 0)

  log(`\n📊 Summary:`, 'cyan')
  log(`   Files: ${validCount}/${results.length} valid`)
  log(`   Total Entries: ${totalEntries}`)
  log(`   Categories: ${foundCategories.length}/${REQUIRED_CATEGORIES.length}`)

  // Exit code
  if (hasErrors) {
    log('\n❌ Validation FAILED - Fix errors above\n', 'red')
    process.exit(1)
  } else if (hasWarnings && strictMode) {
    log('\n⚠️  Validation FAILED (strict mode) - Address warnings above\n', 'yellow')
    process.exit(1)
  } else if (hasWarnings) {
    log('\n⚠️  Validation PASSED with warnings\n', 'yellow')
    process.exit(0)
  } else {
    log('\n✅ Validation PASSED\n', 'green')
    process.exit(0)
  }
}

main()
