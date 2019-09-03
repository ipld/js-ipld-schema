const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const tap = require('tap')
const Schema = require('../ipld-schema')

fs.readdirSync(path.join(__dirname, 'fixtures/bulk')).map((f) => {
  if (!f.endsWith('.yml')) {
    return
  }

  tap.test(`fixture ${f}`, async (t) => {
    const fixture = await loadFixture(f)
    const testName = `fixture ${f}`
    // assume the root type is the first listed (default for the only type listed), otherwise
    // if there is a 'root' in the fixture, use that
    const rootType = fixture.root || Object.keys(fixture.expected)[0]

    t.test(`${testName}: schema parse`, (t) => {
      const schema = new Schema(fixture.schema)
      t.deepEqual(schema.descriptor, fixture.expected, `parsing ${testName}`)
      t.done()
    })

    if (fixture.blocks) {
      fixture.blocks.forEach((block, i) => {
        t.test(`fixture ${f}: block validate (${i}: ${require('util').inspect(block.actual)})`, (t) => {
          const schema = new Schema(fixture.schema)
          t.doesNotThrow(() => { schema.validate(block.actual, rootType) }, `validating good block ${i} in ${testName}`)
          if (block.expected) {
            const loaded = schema.load(block.actual, rootType)
            t.strictSame(loaded, block.expected)
          }
          t.done()
        })
      })
    }

    if (fixture.badBlocks) {
      fixture.badBlocks.forEach((block, i) => {
        t.test(`fixture ${f}: bad block validate (${i})`, (t) => {
          const schema = new Schema(fixture.schema)
          t.throws(() => { schema.validate(block, rootType) }, /validation error/i, `validating bad block ${i} in ${testName}`)
          t.throws(() => { schema.load(block, rootType) }, /validation error/i, `validating bad block ${i} in ${testName}`)
          t.done()
        })
      })
    }
  })
})

async function loadFixture (file) {
  const yamlContent = await fs.promises.readFile(path.join(__dirname, 'fixtures/bulk', file), 'utf8')
  const fixture = yaml.load(yamlContent)
  fixture.expected = JSON.parse(fixture.expected)
  if (fixture.blocks) {
    for (const block of fixture.blocks) {
      block.actual = JSON.parse(block.actual)
      block.expected = JSON.parse(block.expected)
    }
  }
  for (let i = 0; fixture.badBlocks && i < fixture.badBlocks.length; i++) {
    fixture.badBlocks[i] = JSON.parse(fixture.badBlocks[i])
  }
  return fixture
}