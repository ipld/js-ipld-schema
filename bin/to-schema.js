#!/usr/bin/env node

const parser = require('../parser')
const print = require('../print')
const { transformError } = require('../util')
const collectInput = require('./collect-input')

let indent = '  '

async function toSchema (files, options) {
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
        for (const [type, defn] of Object.entries(parsed.schema)) {
          if (schema.schema[type]) {
            console.error(`Error: duplicate type "${type}" found in schema(s)`)
            return process.exit(1)
          }
          schema.schema[type] = defn
        }
      }
    } catch (err) {
      console.error(`Error parsing ${filename}: ${transformError(err).message}`)
      process.exit(1)
    }
  }

  console.log(print(schema, indent))
}

module.exports = toSchema
