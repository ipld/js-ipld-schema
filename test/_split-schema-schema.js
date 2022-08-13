// A run-once script to split up schema-schema.ipldsch into a markdown file per type
// for the purpose of test fixtures

import fs from 'fs'
import { fileURLToPath } from 'url'

async function run () {
  let schemaText = await fs.promises.readFile(new URL('./fixtures/schema-schema.ipldsch', import.meta.url), 'utf8')
  schemaText = schemaText.split('\n')
  const outDir = new URL('./fixtures/schema-schema/', import.meta.url)
  await fs.promises.mkdir(outDir, { recursive: true })

  let block = []
  let inType = null
  let head = true

  async function writeBlock () {
    if (block[block.length - 1]) {
      block.push(null)
    }
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
      const title = line.match(/^type ([A-Z]\w+)/)
      block.unshift(`# schema-schema: \`${title[1]}\``)
    } else if (inType && line.startsWith('#')) {
      await writeBlock()
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
