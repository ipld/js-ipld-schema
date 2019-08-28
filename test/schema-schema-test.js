const fs = require('fs').promises
const path = require('path')
const tap = require('tap')
const Schema = require('../ipld-schema')

tap.test('schema-schema', async (t) => {
  const schemaText = await fs.readFile(path.join(__dirname, 'fixtures/schema-schema.ipldsch'), 'utf8')
  const schema = new Schema(schemaText)
  const expectedSchema = require(path.join(__dirname, 'fixtures/schema-schema.ipldsch.json'))
  t.deepEqual({ schema: schema.descriptor }, expectedSchema)
})
