import * as parser from './parser.cjs'
import { transformError } from './util.js'

export function parse (text) {
  try {
    return parser.parse(text)
  } catch (err) {
    throw transformError(err)
  }
}
