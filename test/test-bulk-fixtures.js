/* eslint-env mocha */

import fs from 'fs'
// @ts-ignore
import yaml from 'js-yaml'
import { fromDSL } from '@ipld/schema/from-dsl.js'
import { toDSL } from '@ipld/schema/to-dsl.js'
import { assert } from 'chai'

/**
 * @typedef {import('../schema-schema').Schema} Schema
 */

describe('fixtures/bulk', () => {
  fs.readdirSync(new URL('./fixtures/bulk/', import.meta.url)).forEach((f) => {
    if (!f.endsWith('.yml')) {
      return
    }

    describe(`fixture ${f}`, () => {
      const testName = `fixture ${f}`
      /** @type {{ schema: string, expected: Schema, canonical?: string }} */
      let fixture
      before(async () => {
        fixture = await loadFixture(f)
      })

      it(`${testName}: schema parse`, () => {
        const schema = fromDSL(fixture.schema)
        assert.deepStrictEqual(schema, fixture.expected, `parsing ${testName}`)
      })

      it(`${testName}: schema canonical`, () => {
        const schema = fromDSL(fixture.schema)
        const schemaCanonical = toDSL(schema)
        const expected = fixture.canonical || fixture.schema
        assert.deepStrictEqual(schemaCanonical.replace(/\n+$/gm, ''), expected.replace(/\n+$/gm, ''), `canonicalizing ${testName}`)
      })
    })
  })
})

/**
 * @param {string} file
 * @returns {Promise<{ schema: string, expected: Schema, canonical?: string }>}
 */
async function loadFixture (file) {
  const yamlContent = await fs.promises.readFile(new URL(file, new URL('./fixtures/bulk/', import.meta.url)), 'utf8')
  const { schema, expected, canonical } = /** @type {{ schema: string, expected: string, canonical?: string }} */ (yaml.load(yamlContent))
  const fixture = {
    schema,
    canonical,
    expected: /** @type {Schema} */(JSON.parse(expected))
  }
  /*
  if (fixture.blocks) {
    for (const block of fixture.blocks) {
      block.actual = JSON.parse(block.actual)
      block.expected = JSON.parse(block.expected)
    }
  }
  for (let i = 0; fixture.badBlocks && i < fixture.badBlocks.length; i++) {
    fixture.badBlocks[i] = JSON.parse(fixture.badBlocks[i])
  }
  */
  return fixture
}
