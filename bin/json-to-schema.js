#!/usr/bin/env node

import { print } from '../print.js'
import { collectInput } from './collect-input.js'

let indent = '  '

export async function jsonToSchema (files, options) {
  if (options.tabs) {
    indent = '\t'
  }

  const input = await collectInput(files)

  for (const { contents } of input) {
    const schema = JSON.parse(contents)
    console.log(print(schema, indent))
  }
}
