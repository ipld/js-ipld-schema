#!/usr/bin/env node

import * as parser from '../parser.cjs'
import { print } from '../print.js'
import { transformError } from '../util.js'
import { collectInput } from './collect-input.js'

let indent = '  '

export async function toSchema (files, options) {
  if (options.tabs) {
    indent = '\t'
  }

  const input = await collectInput(files)

  let schema
  for (const { filename, contents } of input) {
    try {
      const parsed = parser.parse(contents)
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
      console.error(`Error parsing ${filename}: ${transformError(err).message}`)
      process.exit(1)
    }
  }

  console.log(print(schema, indent))
}
