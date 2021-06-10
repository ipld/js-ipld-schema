const parser = require('./parser')
const { transformError } = require('./util')

function parse (text) {
  try {
    return parser.parse(text)
  } catch (err) {
    throw transformError(err)
  }
}

module.exports.parse = parse
