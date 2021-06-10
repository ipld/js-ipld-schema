/* eslint-env mocha */

const path = require('path')
const fs = require('fs/promises')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { assert } = require('chai')
const execFileP = promisify(execFile)

describe('cli', () => {
  it('examples to-json ipldsch', async () => {
    const inFile = path.join(__dirname, 'fixtures/examples.ipldsch')
    const cli = require.resolve('../bin/cli.js')
    const expectedSchema = require(path.join(__dirname, 'fixtures/examples.ipldsch.json'))

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
    const inFile = path.join(__dirname, 'fixtures/examples-adl.ipldsch')
    const cli = require.resolve('../bin/cli.js')
    const expectedSchema = require(path.join(__dirname, 'fixtures/examples-adl.ipldsch.json'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json', inFile])
    assert(!stderr)
    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })

  it('examples to-json md', async () => {
    const inFile = path.join(__dirname, 'fixtures/examples.ipldsch.md')
    const cli = require.resolve('../bin/cli.js')
    const expectedSchema = require(path.join(__dirname, 'fixtures/examples.ipldsch.json'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json', inFile])
    assert(!stderr)

    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })

  it('examples validate ipldsch', async () => {
    const filename = 'examples.ipldsch.md'
    const inFile = path.join(__dirname, 'fixtures', filename)
    const cli = require.resolve('../bin/cli.js')

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'validate', inFile])
    assert(!stdout)
    assert(stderr.includes(filename), `stderr referenced ${filename}`)
  })

  it('examples validate md', async () => {
    const filename = 'examples.ipldsch.md'
    const inFile = path.join(__dirname, 'fixtures', filename)
    const cli = require.resolve('../bin/cli.js')

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'validate', inFile])
    assert(!stdout)
    assert(stderr.includes(filename), `stderr referenced ${filename}`)
  })

  it('validate failure', async () => {
    const inFile = path.join(__dirname, 'bork.ipldsch')
    const cli = require.resolve('../bin/cli.js')

    await fs.writeFile(inFile, 'type Nope NopeNopeNope Nopity Nope nope [&{!')
    let failed = false
    try {
      await execFileP(process.execPath, [cli, 'validate', inFile])
    } catch (err) {
      failed = true
      assert(err.message.includes(inFile))
      assert(!err.stdout)
      assert(err.stderr.includes(inFile))
    } finally {
      await fs.unlink(inFile)
    }
    if (!failed) {
      assert.fail('did not error')
    }
  })

  it('schema-schema multi md validate', async () => {
    const inDir = path.join(__dirname, 'fixtures/schema-schema/')
    const files = (await fs.readdir(inDir)).map((f) => path.join(inDir, f))
    const cli = require.resolve('../bin/cli.js')

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'validate'].concat(files))
    assert(!stdout)
    for (const f of files) {
      assert(stderr.includes(path.basename(f)), `stderr referenced ${path.basename(f)}`)
    }
  })

  it('schema-schema multi md to-json', async () => {
    const inDir = path.join(__dirname, 'fixtures/schema-schema/')
    const files = (await fs.readdir(inDir)).map((f) => path.join(inDir, f))
    const cli = require.resolve('../bin/cli.js')
    const expectedSchema = require(path.join(__dirname, 'fixtures/schema-schema.ipldsch.json'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json'].concat(files))
    assert(!stderr)

    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })

  it('schema-schema multi md to-json', async () => {
    const inDir = path.join(__dirname, 'fixtures/schema-schema/')
    const files = (await fs.readdir(inDir)).map((f) => path.join(inDir, f))
    const cli = require.resolve('../bin/cli.js')
    const expectedSchema = require(path.join(__dirname, 'fixtures/schema-schema.ipldsch.json'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json'].concat(files))
    assert(!stderr)

    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })

  it('examples-all to-json ipldsch', async () => {
    const inFiles = [
      path.join(__dirname, 'fixtures/examples.ipldsch'),
      path.join(__dirname, 'fixtures/examples-adl.ipldsch')
    ]
    const cli = require.resolve('../bin/cli.js')
    const expectedSchema = require(path.join(__dirname, 'fixtures/examples-all.ipldsch.json'))

    const { stdout, stderr } = await execFileP(process.execPath, [cli, 'to-json'].concat(inFiles))
    assert(!stderr)

    const schemaJson = JSON.parse(stdout)
    assert.deepStrictEqual(schemaJson, expectedSchema)
  })
})
