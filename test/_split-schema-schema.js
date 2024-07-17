// A run-once script to split up schema-schema.ipldsch into a markdown file per type
// for the purpose of test fixtures

import fs from 'fs'
import { fileURLToPath } from 'url'

async function run () {
  const schemaTextFull = await fs.promises.readFile(new URL('./fixtures/schema-schema.ipldsch', import.meta.url), 'utf8')
  const schemaText = schemaTextFull.split('\n')
  const outDir = new URL('./fixtures/schema-schema/', import.meta.url)
  await fs.promises.mkdir(outDir, { recursive: true })

  /** @type {string[]} */
  let block = []
  /** @type {null|string} */
  let inType = null
  /** @type {boolean} */
  let head = true
  /** @type {string[]} */
  let typeComments = []

  async function writeBlock () {
    block[block.length - 1] = '```'
    block.push('')
    const file = new URL(`${inType}.md`, outDir)
    await fs.promises.writeFile(file, block.join('\n'), 'utf8')
    console.log('Wrote', inType, 'to', fileURLToPath(file))
    block = []
    inType = null
  }

  for (const line of schemaText) {
    if (head) {
      if (!line) {
        head = false
      }
      continue
    }
    if (/^type/.test(line)) {
      inType = line.split(' ')[1]
      block.push('')
      block.push('```ipldsch')
      block.push(typeComments.join('\n'))
      typeComments = []
      const title = line.match(/^type ([A-Z]\w+)/)
      if (title == null) {
        throw new Error('Malformed schema-schema')
      }
      block.unshift(`# schema-schema: \`${title[1]}\``)
    } else if (line.startsWith('#')) {
      typeComments.push(line)
      if (inType) {
        await writeBlock()
      }
    }

    if (!inType && /^\s*$/.test(line)) {
      typeComments = [] // reset
    }

    if (!block.length) {
      block.push('')
    }
    block.push(line.replace(/^#+\s?/, ''))
  }

  if (inType) {
    await writeBlock()
  }
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
