/* eslint-env mocha */

import fs from 'fs'
import { fromDSL } from '@ipld/schema/from-dsl.js'
import { assert } from 'chai'

it('examples', async () => {
  const schemaText = await fs.promises.readFile(new URL('./fixtures/examples.ipldsch', import.meta.url), 'utf8')
  const schema = fromDSL(schemaText)
  const expectedSchema = JSON.parse(await fs.promises.readFile(new URL('./fixtures/examples.ipldsch.json', import.meta.url), 'utf8'))
  assert.deepStrictEqual(schema, expectedSchema)
})
