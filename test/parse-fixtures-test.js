const fs = require('fs')
const path = require('path')
const { test } = require('tap')
const parser = require('../parser')

fs.readdirSync(path.join(__dirname, 'fixtures')).forEach((f) => {
  if (!f.endsWith('.txt')) {
    return
  }

  test(`fixture ${f.replace(/\.txt$/, '')}`, async (t) => {
    const fixture = await fs.promises.readFile(path.join(__dirname, 'fixtures', f), 'utf8')
    const schemaMatch = fixture.match(/--- schema\n([\s\S]+)\n--- expected/m)
    if (!schemaMatch) {
      throw new Error(`No schema section found in ${f}`)
    }
    const schema = schemaMatch[1]
    const expectedJSONMatch = fixture.match(/--- expected\n([\s\S]+)\n---/m)
    if (!expectedJSONMatch) {
      throw new Error(`No expected JSON section found in ${f}`)
    }
    let expected
    try {
      expected = JSON.parse(expectedJSONMatch[1])
    } catch (e) {
      throw new Error(`Error parsing expected JSON section: ${e.message}`)
    }
    let actual = parser.parse(schema)
    t.deepEqual(actual.schema, expected)
    t.done()
  })
})
