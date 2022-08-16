/* eslint-env mocha */

import path from 'path'
import fs from 'fs'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { fileURLToPath } from 'url'
import { assert } from 'chai'

const execFileP = promisify(execFile)

describe('cli', () => {
  it('examples to-json ipldsch', async () => {
    const inFile = fileURLToPath(new URL('./fixtures/examples.ipldsch', import.meta.url))
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))
    const expectedSchema = JSON.parse(await fs.promises.readFile(new URL('./fixtures/examples.ipldsch.json', import.meta.url), 'utf8'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json', inFile])
    assert(!stderr)
    let schemaJson
    try {
      schemaJson = JSON.parse(stdout)
    } catch (err) {
      assert.ifError(err)
    }
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })

  it('examples-adl to-json ipldsch', async () => {
    const inFile = fileURLToPath(new URL('./fixtures/examples-adl.ipldsch', import.meta.url))
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))
    const expectedSchema = JSON.parse(await fs.promises.readFile(new URL('./fixtures/examples-adl.ipldsch.json', import.meta.url), 'utf8'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json', inFile])
    assert(!stderr)
    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })

  it('examples to-json md', async () => {
    const inFile = fileURLToPath(new URL('./fixtures/examples.ipldsch.md', import.meta.url))
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))
    const expectedSchema = JSON.parse(await fs.promises.readFile(new URL('./fixtures/examples.ipldsch.json', import.meta.url), 'utf8'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json', inFile])
    assert(!stderr)

    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })

  it('examples validate ipldsch', async () => {
    const filename = 'examples.ipldsch.md'
    const inFile = fileURLToPath(new URL(filename, new URL('./fixtures/', import.meta.url)))
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'validate', inFile])
    assert(!stdout)
    assert(stderr.includes(filename), `stderr referenced ${filename}`)
  })

  it('examples validate md', async () => {
    const filename = 'examples.ipldsch.md'
    const inFile = fileURLToPath(new URL(filename, new URL('./fixtures/', import.meta.url)))
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'validate', inFile])
    assert(!stdout)
    assert(stderr.includes(filename), `stderr referenced ${filename}`)
  })

  it('validate failure', async () => {
    const inFile = fileURLToPath(new URL('bork.ipldsch', import.meta.url))
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))

    await fs.promises.writeFile(inFile, 'type Nope NopeNopeNope Nopity Nope nope [&{!')
    let failed = false
    try {
      await execFileP(process.execPath, [cli, 'validate', inFile])
    } catch (err) {
      failed = true
      // @ts-ignore
      assert(err.message.includes(inFile))
      // @ts-ignore
      assert(!err.stdout)
      // @ts-ignore
      assert(err.stderr.includes(inFile))
    } finally {
      await fs.promises.unlink(inFile)
    }
    if (!failed) {
      assert.fail('did not error')
    }
  })

  it('schema-schema multi md validate', async () => {
    const inDir = fileURLToPath(new URL('./fixtures/schema-schema/', import.meta.url))
    const files = (await fs.promises.readdir(inDir)).map((f) => path.join(inDir, f))
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'validate'].concat(files))
    assert(!stdout)
    for (const f of files) {
      assert(stderr.includes(path.basename(f)), `stderr referenced ${path.basename(f)}`)
    }
  })

  it('schema-schema multi md to-json', async () => {
    const inDir = fileURLToPath(new URL('./fixtures/schema-schema/', import.meta.url))
    const files = (await fs.promises.readdir(inDir)).map((f) => path.join(inDir, f))
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))
    const expectedSchema = JSON.parse(await fs.promises.readFile(new URL('./fixtures/schema-schema.ipldsch.json', import.meta.url), 'utf8'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json'].concat(files))
    assert(!stderr)

    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })

  it('schema-schema multi md to-json', async () => {
    const inDir = fileURLToPath(new URL('./fixtures/schema-schema/', import.meta.url))
    const files = (await fs.promises.readdir(inDir)).map((f) => path.join(inDir, f))
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))
    const expectedSchema = JSON.parse(await fs.promises.readFile(new URL('./fixtures/schema-schema.ipldsch.json', import.meta.url), 'utf8'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json'].concat(files))
    assert(!stderr)

    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })

  it('examples-all to-json ipldsch', async () => {
    const inFiles = [
      fileURLToPath(new URL('./fixtures/examples.ipldsch', import.meta.url)),
      fileURLToPath(new URL('./fixtures/examples-adl.ipldsch', import.meta.url))
    ]
    const cli = fileURLToPath(new URL('../bin/cli.js', import.meta.url))
    const expectedSchema = JSON.parse(await fs.promises.readFile(new URL('./fixtures/examples-all.ipldsch.json', import.meta.url), 'utf8'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json'].concat(inFiles))
    assert(!stderr)

    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })
})
