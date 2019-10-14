const path = require('path')
const fs = require('fs')
const { execFile } = require('child_process')
const tap = require('tap')

tap.test('examples to-json ipldsch', (t) => {
  const inFile = path.join(__dirname, 'fixtures/examples.ipldsch')
  const cli = require.resolve('../bin/cli.js')
  const expectedSchema = require(path.join(__dirname, 'fixtures/examples.ipldsch.json'))

  execFile(process.execPath, [cli, 'to-json', inFile], (err, stdout, stderr) => {
    t.error(err)
    t.ok(!stderr)

    let schemaJson
    try {
      schemaJson = JSON.parse(stdout)
    } catch (err) {
      t.error(err)
    }
    t.deepEqual(schemaJson, expectedSchema)
  }).on('close', (code) => {
    t.equal(code, 0, 'exit code')
    t.done()
  })
})

tap.test('examples-adl to-json ipldsch', (t) => {
  const inFile = path.join(__dirname, 'fixtures/examples-adl.ipldsch')
  const cli = require.resolve('../bin/cli.js')
  const expectedSchema = require(path.join(__dirname, 'fixtures/examples-adl.ipldsch.json'))

  execFile(process.execPath, [cli, 'to-json', inFile], (err, stdout, stderr) => {
    t.error(err)
    t.ok(!stderr)

    let schemaJson
    try {
      schemaJson = JSON.parse(stdout)
    } catch (err) {
      t.error(err)
    }
    t.deepEqual(schemaJson, expectedSchema)
  }).on('close', (code) => {
    t.equal(code, 0, 'exit code')
    t.done()
  })
})

tap.test('examples to-json md', (t) => {
  const inFile = path.join(__dirname, 'fixtures/examples.ipldsch.md')
  const cli = require.resolve('../bin/cli.js')
  const expectedSchema = require(path.join(__dirname, 'fixtures/examples.ipldsch.json'))

  execFile(process.execPath, [cli, 'to-json', inFile], (err, stdout, stderr) => {
    t.error(err)
    t.ok(!stderr)

    let schemaJson
    try {
      schemaJson = JSON.parse(stdout)
    } catch (err) {
      t.error(err)
    }
    t.deepEqual(schemaJson, expectedSchema)
  }).on('close', (code) => {
    t.equal(code, 0, 'exit code')
    t.done()
  })
})

tap.test('examples validate ipldsch', (t) => {
  const filename = 'fixtures/examples.ipldsch.md'
  const inFile = path.join(__dirname, filename)
  const cli = require.resolve('../bin/cli.js')

  execFile(process.execPath, [cli, 'validate', inFile], (err, stdout, stderr) => {
    t.error(err)
    t.ok(!stdout)
    t.contains(stderr, filename, `stderr referenced ${filename}`)
  }).on('close', (code) => {
    t.equal(code, 0, 'exit code')
    t.done()
  })
})

tap.test('examples validate md', (t) => {
  const filename = 'fixtures/examples.ipldsch.md'
  const inFile = path.join(__dirname, filename)
  const cli = require.resolve('../bin/cli.js')

  execFile(process.execPath, [cli, 'validate', inFile], (err, stdout, stderr) => {
    t.error(err)
    t.ok(!stdout)
    t.contains(stderr, filename, `stderr referenced ${filename}`)
  }).on('close', (code) => {
    t.equal(code, 0, 'exit code')
    t.done()
  })
})

tap.test('validate failure', (t) => {
  const inFile = path.join(__dirname, 'bork.ipldsch')
  const cli = require.resolve('../bin/cli.js')

  fs.writeFile(inFile, 'type Nope NopeNopeNope Nopity Nope nope [&{!', () => {
    execFile(process.execPath, [cli, 'validate', inFile], (err, stdout, stderr) => {
      fs.unlink(inFile, () => {})
      t.ok(err)
      t.contains(err.message, inFile)
      t.ok(!stdout)
      t.contains(stderr, inFile)
    }).on('close', (code) => {
      t.equal(code, 1, 'exit code')
      t.done()
    })
  })
})

tap.test('schema-schema multi md validate', (t) => {
  const inDir = path.join(__dirname, 'fixtures/schema-schema/')
  const files = fs.readdirSync(inDir)
    .map((f) => path.join(inDir, f))
  const cli = require.resolve('../bin/cli.js')

  execFile(process.execPath, [cli, 'validate'].concat(files), (err, stdout, stderr) => {
    t.error(err)
    t.ok(!stdout)
    for (const f of files) {
      t.contains(stderr, path.basename(f), `stderr referenced ${path.basename(f)}`)
    }
  }).on('close', (code) => {
    t.equal(code, 0, 'exit code')
    t.done()
  })
})

tap.test('schema-schema multi md to-json', (t) => {
  const inDir = path.join(__dirname, 'fixtures/schema-schema/')
  const files = fs.readdirSync(inDir)
    .map((f) => path.join(inDir, f))
  const cli = require.resolve('../bin/cli.js')
  const expectedSchema = require(path.join(__dirname, 'fixtures/schema-schema.ipldsch.json'))

  execFile(process.execPath, [cli, 'to-json'].concat(files), (err, stdout, stderr) => {
    t.error(err)
    t.ok(!stderr)

    let schemaJson
    try {
      schemaJson = JSON.parse(stdout)
    } catch (err) {
      t.error(err)
    }
    t.deepEqual(schemaJson, expectedSchema)
  }).on('close', (code) => {
    t.equal(code, 0, 'exit code')
    t.done()
  })
})

tap.test('schema-schema multi md to-json', (t) => {
  const inDir = path.join(__dirname, 'fixtures/schema-schema/')
  const files = fs.readdirSync(inDir)
    .map((f) => path.join(inDir, f))
  const cli = require.resolve('../bin/cli.js')
  const expectedSchema = require(path.join(__dirname, 'fixtures/schema-schema.ipldsch.json'))

  execFile(process.execPath, [cli, 'to-json'].concat(files), (err, stdout, stderr) => {
    t.error(err)
    t.ok(!stderr)

    let schemaJson
    try {
      schemaJson = JSON.parse(stdout)
    } catch (err) {
      t.error(err)
    }
    t.deepEqual(schemaJson, expectedSchema)
  }).on('close', (code) => {
    t.equal(code, 0, 'exit code')
    t.done()
  })
})

tap.test('examples-all to-json ipldsch', (t) => {
  const inFiles = [
    path.join(__dirname, 'fixtures/examples.ipldsch'),
    path.join(__dirname, 'fixtures/examples-adl.ipldsch')
  ]
  const cli = require.resolve('../bin/cli.js')
  const expectedSchema = require(path.join(__dirname, 'fixtures/examples-all.ipldsch.json'))

  execFile(process.execPath, [cli, 'to-json'].concat(inFiles), (err, stdout, stderr) => {
    t.error(err)
    t.ok(!stderr)

    let schemaJson
    try {
      schemaJson = JSON.parse(stdout)
    } catch (err) {
      t.error(err)
    }
    t.deepEqual(schemaJson, expectedSchema)
  }).on('close', (code) => {
    t.equal(code, 0, 'exit code')
    t.done()
  })
})