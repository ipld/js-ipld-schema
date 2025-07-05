#!/usr/bin/env node

import { fromDSL } from '../lib/from-dsl.js'
import { toDSL } from '../lib/to-dsl.js'
import { collectInput } from './collect-input.js'

let indent = '  '

/**
 * @param {string[]} files
 * @param {{tabs?:boolean}} options
 * @returns
 */
export async function toSchema (files, options) {
  if (options.tabs) {
    indent = '\t'
  }

  const input = await collectInput(files)

  let schema
  for (const { filename, contents } of input) {
    try {
      const parsed = fromDSL(contents)
      if (!schema) {
        schema = parsed
      } else {
        for (const [type, defn] of Object.entries(parsed.types)) {
          if (schema.types[type]) {
            console.error(`Error: duplicate type "${type}" found in schema(s)`)
            return process.exit(1)
          }
          schema.types[type] = defn
        }
      }
    } catch (err) {
      // @ts-ignore
      console.error(`Error parsing ${filename}: ${err.message}`)
      process.exit(1)
    }
  }

  if (schema) {
    console.log(toDSL(schema, indent))
  }
}
