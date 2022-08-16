import * as parser from '../lib/parser.cjs'
import { transformError } from '../lib/util.js'
import { collectInput } from './collect-input.js'

/**
 * @param {string[]} files
 * @param {{tabs?:boolean}} _
 * @returns
 */
export async function validate (files, _) {
  const input = await collectInput(files)

  for (const { filename, contents } of input) {
    try {
      parser.parse(contents)
    } catch (err) {
      // @ts-ignore
      console.error(`Could not validate ${filename}: ${transformError(err).message}`) // discard useless extra info
      process.exit(1)
    }
    console.error(`Validated ${filename} ...`)
  }
}
