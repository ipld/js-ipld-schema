#!/usr/bin/env node

const print = require('../print')
const collectInput = require('./collect-input')

let indent = '  '

async function toSchema (files, options) {
  if (options.tabs) {
    indent = '\t'
  }

  const input = await collectInput(files)

  for (const { contents } of input) {
    const schema = JSON.parse(contents)
    console.log(print(schema, indent))
  }
}

module.exports = toSchema
