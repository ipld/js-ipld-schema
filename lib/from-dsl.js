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
    // Normalize line endings to LF for consistent behavior across platforms
    const normalizedInput = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    return /** @type {Schema} */(parser.parse(normalizedInput, options))
  } catch (err) {
    throw transformError(err)
  }
}
