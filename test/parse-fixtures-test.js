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
    const yamlContent = await fs.promises.readFile(path.join(__dirname, 'fixtures/bulk', f), 'utf8')
    const fixture = yaml.load(yamlContent)
    const testName = `fixture ${f}`
    const rootType = Object.keys(fixture.expected)[0]

    t.test(`${testName}: schema parse`, (t) => {
      const schema = new Schema(fixture.schema)
      t.deepEqual(schema.descriptor, fixture.expected, `parsing ${testName}`)
      t.done()
    })

    if (fixture.blocks) {
      fixture.blocks.forEach((block, i) => {
        t.test(`fixture ${f}: block validate (${i})`, (t) => {
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
