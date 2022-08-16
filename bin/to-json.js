#!/usr/bin/env node

import * as parser from '../lib/parser.cjs'
import { transformError } from '../lib/util.js'
import { collectInput } from './collect-input.js'

/**
 * @typedef {import('../schema-schema').Schema} Schema
 */

let indent = '  '

/**
 * @param {string[]} files
 * @param {{tabs?:boolean}} options
 * @returns
 */
export async function toJSON (files, options) {
  if (options.tabs) {
    indent = '\t'
  }

  const input = await collectInput(files)

  /** @type {Schema|null} */
  let schema = null
  for (const { filename, contents } of input) {
    try {
      const parsed = parser.parse(contents)
      if (schema == null) {
        schema = parsed
      } else {
        const copy = (/** @type {'types'|'advanced'} */ coll) => {
          if (schema == null) {
            throw new Error('Unexpected state')
          }
          if (parsed[coll] == null) {
            return
          }
          if (schema[coll] == null) {
            schema[coll] = {}
          }
          for (const [type, defn] of Object.entries(parsed[coll])) {
            // @ts-ignore FIXME
            if (coll in schema && type in schema[coll]) {
              console.error(`Error: duplicate ${coll} "${type}" found in schema(s)`)
              return process.exit(1)
            }
            // @ts-ignore FIXME
            schema[coll][type] = defn
          }
        }
        copy('types')
        copy('advanced')
      }
    } catch (err) {
      // @ts-ignore
      console.error(`Error parsing ${filename}: ${transformError(err).message}`)
      process.exit(1)
    }
  }

  console.log(JSON.stringify(schema, null, indent))
}
