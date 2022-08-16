import * as parser from './parser.cjs'
import { transformError } from './util.js'

/**
 * @typedef {import('../schema-schema').Schema} Schema
 */

/**
 * @param {string} input
 * @returns {Schema}
 */
export function fromDSL (input) {
  try {
    return /** @type {Schema} */(parser.parse(input))
  } catch (err) {
    throw transformError(err)
  }
}
