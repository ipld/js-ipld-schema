#!/usr/bin/env node

import { readFile } from 'fs/promises'
import * as parser from '../lib/parser.cjs'
import { transformError } from '../lib/util.js'
import { collectInput } from './collect-input.js'
import { Builder, safeReference } from '../lib/typed.js'

/**
 * @typedef {import('../schema-schema').Schema} Schema
 */

/**
 * @param {string[]} files
 * @param {{cjs:boolean}} options
 * @returns
 */
export async function toJS (files, options) {
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
      // @ts-ignore
      console.error(`Error parsing ${filename}: ${transformError(err).message}`)
      process.exit(1)
    }
  }

  const builder = new Builder(schema)
  const types = Object.keys(schema.types)
  for (const type of types) {
    builder.addType(type)
  }
  const schemaContent = input.map(({ contents }) => contents).join('\n').replace(/^/mg, ' * ').replace(/\s+$/mg, '')
  console.log(`/** Auto-generated with ${await pkgDecjsor()} at ${new Date().toDateString()} from IPLD Schema:\n *\n${schemaContent}\n */\n`)
  console.log(builder.dumpTypeTransformers())
  for (const type of types) {
    console.log(`
${options.cjs === true ? `module.exports${safeReference(type)}` : `export const ${type}`} = {
  toTyped: Types${safeReference(type)},
  toRepresentation: Reprs${safeReference(type)}
}`)
  }
}

async function pkgDecjsor () {
  const p = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  return `${p.name}@v${p.version}`
}
