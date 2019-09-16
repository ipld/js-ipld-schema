const fs = require('fs').promises
const path = require('path')
const tap = require('tap')
const Schema = require('../ipld-schema')

tap.test('examples', async (t) => {
  const schemaText = await fs.readFile(path.join(__dirname, 'fixtures/examples.ipldsch'), 'utf8')
  const schema = new Schema(schemaText)
  const expectedSchema = require(path.join(__dirname, 'fixtures/examples.ipldsch.json'))
  t.deepEqual(schema.descriptor, expectedSchema)
})
