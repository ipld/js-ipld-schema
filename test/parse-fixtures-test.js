const fs = require('fs')
const path = require('path')
const { test } = require('tap')
const Schema = require('../ipld-schema')

// using an async function in forEach() because we don't need it to be
// resolved right here, tap will take care of it
fs.readdirSync(path.join(__dirname, 'fixtures/bulk')).forEach(async (f) => {
  if (!f.endsWith('.txt')) {
    return
  }

  const fixture = await loadFixture(f)

  test(`fixture ${f.replace(/\.txt$/, '')} schema parse`, (t) => {
    let schema = new Schema(fixture.schema)
    t.deepEqual(schema.descriptor, fixture.expectedParsed)
    t.done()
  })

  fixture.blocks.forEach((block, i) => {
    test(`fixture ${f.replace(/\.txt$/, '')} block validate (${i})`, (t) => {
      let schema = new Schema(fixture.schema)
      console.log('load [', block.block, ']')
      t.doesNotThrow(() => { schema.validate(block.block) })
      t.done()
    })
  })
})

async function loadFixture (f) {
  const fixture = { blocks: [] }
  const fixtureText = await fs.promises.readFile(path.join(__dirname, 'fixtures/bulk', f), 'utf8')
  let append
  let block
  let match
  fixtureText.split('\n').forEach((line) => {
    if (line === '--- schema') {
      if (fixture.schema) {
        throw new Error('Duplicate schema section')
      }
      fixture.schema = ''
      append = (l) => { fixture.schema += `${l}\n` }
    } else if (line === '--- expected' || line === '--- expectedparsed') {
      if (fixture.expectedParsedJSON) {
        throw new Error('Duplicate expectedparsed section')
      }
      fixture.expectedParsedJSON = ''
      append = (l) => { fixture.expectedParsedJSON += `${l}\n` }
    } else if ((match = line.match(/^--- block(\d+)/)) != null) {
      block = parseInt(match[1], 10) - 1
      if (fixture.blocks[block]) {
        throw new Error(`Duplicate block${block} section`)
      }
      fixture.blocks[block] = { blockJSON: '' }
      append = (l) => { fixture.blocks[block].blockJSON += `${l}\n` }
    } else if ((match = line.match(/^--- expectedloaded(\d+)/)) != null) {
      let i = parseInt(match[1], 10) - 1
      if (i !== block) {
        throw new Error(`Unexpected expectedloaded${i} section`)
      }
      fixture.blocks[block].expectedLoadedJSON = ''
      append = (l) => { fixture.blocks[block].expectedLoadedJSON += `${l}\n` }
    } else if (line.startsWith('--- ')) {
      throw new Error(`Unexpected fixture section '${line}'`)
    } else if (line !== '---' && append) {
      append(line)
    }
  })
  if (!fixture.schema) {
    throw new Error(`No schema section found in ${f}`)
  }
  if (!fixture.expectedParsedJSON) {
    throw new Error(`No expected JSON section found in ${f}`)
  }
  try {
    fixture.expectedParsed = JSON.parse(fixture.expectedParsedJSON)
  } catch (e) {
    throw new Error(`Error parsing expected JSON section: ${e.message}`)
  }
  fixture.blocks.forEach((b, i) => {
    try {
      b.block = JSON.parse(b.blockJSON)
    } catch (e) {
      throw new Error(`Error parsing block${i} JSON section: ${e.message}`)
    }
    try {
      b.expectedLoaded = JSON.parse(b.expectedLoadedJSON)
    } catch (e) {
      throw new Error(`Error parsing expectedLoaded${i} JSON section: ${e.message}`)
    }
  })
  return fixture
}
