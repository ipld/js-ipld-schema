// @ts-ignore
// @ts-nocheck
/* eslint-env mocha */

import { readFile } from 'node:fs/promises'
import { assert } from 'chai'
import { parse, index } from 'testmark.js'
import { fromDSL } from '@ipld/schema/from-dsl.js'
import { generateGo, generateRust, generateTypeScript } from '@ipld/schema/gen.js'

describe('Generate Filecoin miner types', () => {
  let schema, expectedGo, expectedRust, expectedTypeScript

  before(async () => {
    const contents = await readFile(new URL('./fixtures/gen/filecoin_miner_types.md', import.meta.url), 'utf8')
    const dirEnt = index(parse(contents))
    const schemaText = dirEnt.children.get('test').children.get('schema').hunk.body
    schema = fromDSL(schemaText, { includeComments: true, includeAnnotations: true })
    expectedGo = dirEnt.children.get('test').children.get('golang').hunk.body
    expectedRust = dirEnt.children.get('test').children.get('rust').hunk.body
    expectedTypeScript = dirEnt.children.get('test').children.get('typescript').hunk.body
  })

  it('Go', async () => {
    const go = generateGo(schema, { package: 'testpkg' })
    assert.strictEqual(go, expectedGo)
  })

  it('Rust', async () => {
    const rust = generateRust(schema)
    assert.strictEqual(rust, expectedRust)
  })

  it('TypeScript', async () => {
    const rust = generateTypeScript(schema)
    assert.strictEqual(rust, expectedTypeScript)
  })
})

describe('Generate enum types', () => {
  let schema, expectedGo, expectedRust, expectedTypeScript

  before(async () => {
    const contents = await readFile(new URL('./fixtures/gen/enums.md', import.meta.url), 'utf8')
    const dirEnt = index(parse(contents))
    const schemaText = dirEnt.children.get('test').children.get('schema').hunk.body
    schema = fromDSL(schemaText, { includeComments: true, includeAnnotations: true })
    expectedGo = dirEnt.children.get('test').children.get('golang').hunk.body
    expectedRust = dirEnt.children.get('test').children.get('rust').hunk.body
    expectedTypeScript = dirEnt.children.get('test').children.get('typescript').hunk.body
  })

  it('Go', async () => {
    const go = generateGo(schema, { package: 'main' })
    assert.strictEqual(go, expectedGo)
  })

  it('Rust', async () => {
    const rust = generateRust(schema)
    assert.strictEqual(rust, expectedRust)
  })

  it('TypeScript', async () => {
    const ts = generateTypeScript(schema)
    assert.strictEqual(ts, expectedTypeScript)
  })
})

describe('Generate list types', () => {
  let schema, expectedGo, expectedRust, expectedTypeScript

  before(async () => {
    const contents = await readFile(new URL('./fixtures/gen/lists.md', import.meta.url), 'utf8')
    const dirEnt = index(parse(contents))
    const schemaText = dirEnt.children.get('test').children.get('schema').hunk.body
    schema = fromDSL(schemaText, { includeComments: true, includeAnnotations: true })
    expectedGo = dirEnt.children.get('test').children.get('golang').hunk.body
    expectedRust = dirEnt.children.get('test').children.get('rust').hunk.body
    expectedTypeScript = dirEnt.children.get('test').children.get('typescript').hunk.body
  })

  it('Go', async () => {
    const go = generateGo(schema, { package: 'main' })
    assert.strictEqual(go, expectedGo)
  })

  it('Rust', async () => {
    const rust = generateRust(schema)
    assert.strictEqual(rust, expectedRust)
  })

  it('TypeScript', async () => {
    const ts = generateTypeScript(schema)
    assert.strictEqual(ts, expectedTypeScript)
  })
})

describe('Generate map types', () => {
  let schema, expectedGo, expectedRust, expectedTypeScript

  before(async () => {
    const contents = await readFile(new URL('./fixtures/gen/maps.md', import.meta.url), 'utf8')
    const dirEnt = index(parse(contents))
    const schemaText = dirEnt.children.get('test').children.get('schema').hunk.body
    schema = fromDSL(schemaText, { includeComments: true, includeAnnotations: true })
    expectedGo = dirEnt.children.get('test').children.get('golang').hunk.body
    expectedRust = dirEnt.children.get('test').children.get('rust').hunk.body
    expectedTypeScript = dirEnt.children.get('test').children.get('typescript').hunk.body
  })

  it('Go', async () => {
    const go = generateGo(schema, { package: 'main' })
    assert.strictEqual(go, expectedGo)
  })

  it('Rust', async () => {
    const rust = generateRust(schema)
    assert.strictEqual(rust, expectedRust)
  })

  it('TypeScript', async () => {
    const ts = generateTypeScript(schema)
    assert.strictEqual(ts, expectedTypeScript)
  })
})
