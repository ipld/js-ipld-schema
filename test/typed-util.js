import { create, Builder } from '@ipld/schema/typed.js'
import * as chai from 'chai'
// @ts-ignore
import standard from 'standard'

/**
 * @typedef {(obj:any)=>undefined|any} TypeTransformerFunction
 */

/**
 * @param {string} plainJs
 */
export async function lintPlainJS (plainJs) {
  if (standard) { // not in browser
    const [result] = await standard.lintText(plainJs)
    if (result) {
      for (const message of result.messages) {
        console.error(
          '%d:%d: %s%s%s',
          message.line || 0,
          message.column || 0,
          message.message,
          ' (' + message.ruleId + ')',
          message.severity === 1 ? ' (warning)' : ''
        )
      }
      if (result.messages.length) {
        chai.assert.fail(`Failed to lint JS:\n${plainJs}`)
      }
    }
  }
}

/**
 * @param {import('schema-schema.js').Schema} schema
 * @param {string} rootType
 * @returns {Promise<{ toTyped: TypeTransformerFunction, toRepresentation: TypeTransformerFunction }>}
 */
export async function buildAndVerify (schema, rootType) {
  const builder = new Builder(schema)
  builder.addType(rootType)
  const transformers = builder.dumpTypeTransformers()
  await lintPlainJS(`${transformers}\nif (Types && Reprs) { console.log('yep') }\n`)

  return create(schema, rootType)
}
