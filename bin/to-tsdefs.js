#!/usr/bin/env node

import { fromDSL } from '../lib/from-dsl.js'
import { pkgDecjsor } from './util.js'
import { collectInput } from './collect-input.js'
import { generateTypeScript } from '../lib/gen.js'

/**
 * @typedef {import('../schema-schema').Schema} Schema
 */

/**
 * @param {string[]} files
 * @param {{cjs:boolean}} _options
 * @returns
 */
export async function toTSDefs (files, _options) {
  const input = await collectInput(files)
  let schema
  for (const { filename, contents } of input) {
    try {
      /** @type {any} */
      const parsed = fromDSL(contents, { includeComments: true, includeAnnotations: true })
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

  const schemaContent = input.map(({ contents }) => contents).join('\n').replace(/^/mg, ' * ').replace(/\s+$/mg, '')
  console.log(`/** Auto-generated with ${await pkgDecjsor()} at ${new Date().toDateString()} from IPLD Schema:\n *\n${schemaContent}\n */\n`)
  console.log(generateTypeScript(schema))
}
