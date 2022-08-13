/* eslint-env mocha */

import fs from 'fs'
import yaml from 'js-yaml'
import { parse } from '../ipld-schema.js'
import { print } from '../print.js'
import { assert } from 'chai'

describe('fixtures/bulk', () => {
  fs.readdirSync(new URL('./fixtures/bulk/', import.meta.url)).forEach((f) => {
    if (!f.endsWith('.yml')) {
      return
    }

    describe(`fixture ${f}`, () => {
      const testName = `fixture ${f}`
      let fixture
      before(async () => {
        fixture = await loadFixture(f)
      })

      it(`${testName}: schema parse`, () => {
        const schema = parse(fixture.schema)
        assert.deepStrictEqual(schema, fixture.expected, `parsing ${testName}`)
      })

      it(`${testName}: schema canonical`, () => {
        const schema = parse(fixture.schema)
        const schemaCanonical = print(schema)
        const expected = fixture.canonical || fixture.schema
        assert.deepStrictEqual(schemaCanonical.replace(/\n+$/gm, ''), expected.replace(/\n+$/gm, ''), `canonicalizing ${testName}`)
      })
    })
  })
})

async function loadFixture (file) {
  const yamlContent = await fs.promises.readFile(new URL(file, new URL('./fixtures/bulk/', import.meta.url)), 'utf8')
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
