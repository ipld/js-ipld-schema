// A run-once script to split up schema-schema.ipldsch into a markdown file per type
// for the purpose of test fixtures

const fs = require('fs').promises
const path = require('path')

async function run () {
  let schemaText = await fs.readFile(path.join(__dirname, 'fixtures/schema-schema.ipldsch'), 'utf8')
  schemaText = schemaText.split('\n')
  const outDir = path.join(__dirname, 'fixtures/schema-schema/')
  await fs.mkdir(outDir, { recursive: true })

  let block = []
  let inType = null
  let head = true

  async function writeBlock () {
    if (block[block.length - 1]) {
      block.push(null)
    }
    block[block.length - 1] = '```'
    block.push('')
    const file = path.join(outDir, `${inType}.md`)
    await fs.writeFile(file, block.join('\n'), 'utf8')
    console.log('Wrote', inType, 'to', file)
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
