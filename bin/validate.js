const parser = require('../parser')
const { transformError } = require('../util')
const collectInput = require('./collect-input')

async function validate (files) {
  const input = await collectInput(files)

  for (const { filename, contents } of input) {
    try {
      parser.parse(contents)
    } catch (err) {
      console.error(`Could not validate ${filename}: ${transformError(err).message}`) // discard useless extra info
      process.exit(1)
    }
    console.error(`Validated ${filename} ...`)
  }
}

module.exports = validate
