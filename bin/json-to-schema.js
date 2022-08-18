#!/usr/bin/env node

import { toDSL } from '@ipld/schema/to-dsl.js'
import { collectInput } from './collect-input.js'

let indent = '  '

/**
 * @param {string[]} files
 * @param {{tabs?:boolean}} options
 * @returns
 */
export async function jsonToSchema (files, options) {
  if (options.tabs) {
    indent = '\t'
  }

  const input = await collectInput(files)

  for (const { contents } of input) {
    const schema = JSON.parse(contents)
    console.log(toDSL(schema, indent))
  }
}
