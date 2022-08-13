/* eslint-env mocha */

import fs from 'fs'
import { parse } from '../ipld-schema.js'
import { assert } from 'chai'

it('examples', async () => {
  const schemaText = await fs.promises.readFile(new URL('./fixtures/examples.ipldsch', import.meta.url), 'utf8')
  const schema = parse(schemaText)
  const expectedSchema = JSON.parse(await fs.promises.readFile(new URL('./fixtures/examples.ipldsch.json', import.meta.url)))
  assert.deepStrictEqual(schema, expectedSchema)
})
