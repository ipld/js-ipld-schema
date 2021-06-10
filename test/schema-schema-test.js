/* eslint-env mocha */

const fs = require('fs/promises')
const path = require('path')
const { parse } = require('../ipld-schema')
const { assert } = require('chai')

it('schema-schema', async () => {
  const schemaText = await fs.readFile(path.join(__dirname, 'fixtures/schema-schema.ipldsch'), 'utf8')
  const schema = parse(schemaText)
  const expectedSchema = require(path.join(__dirname, 'fixtures/schema-schema.ipldsch.json'))
  assert.deepStrictEqual(schema, expectedSchema)
})
