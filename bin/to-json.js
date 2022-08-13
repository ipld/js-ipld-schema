#!/usr/bin/env node

import * as parser from '../parser.cjs'
import { transformError } from '../util.js'
import { collectInput } from './collect-input.js'

let indent = '  '

export async function toJSON (files, options) {
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
        const copy = (coll) => {
          if (!parsed[coll]) {
            return
          }
          if (!schema[coll]) {
            schema[coll] = {}
          }
          for (const [type, defn] of Object.entries(parsed[coll])) {
            if (schema[coll][type]) {
              console.error(`Error: duplicate ${coll} "${type}" found in schema(s)`)
              return process.exit(1)
            }
            schema[coll][type] = defn
          }
        }
        copy('types')
        copy('advanced')
      }
    } catch (err) {
      console.error(`Error parsing ${filename}: ${transformError(err).message}`)
      process.exit(1)
    }
  }

  console.log(JSON.stringify(schema, null, indent))
}
