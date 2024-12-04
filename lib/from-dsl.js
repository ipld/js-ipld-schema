import parser from './parser.cjs'
import { transformError } from './util.js'

/**
 * @typedef {import('../schema-schema').Schema} Schema
 */

/**
 * @param {string} input
 * @param {Record<string, any>} [options]
 * @returns {Schema}
 */
export function fromDSL (input, options = {}) {
  try {
    return /** @type {Schema} */(parser.parse(input, options))
  } catch (err) {
    throw transformError(err)
  }
}
