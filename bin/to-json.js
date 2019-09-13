#!/usr/bin/env node

const fs = require('fs').promises
fs.constants = require('fs').constants
const getStdin = require('get-stdin')
const parser = require('../parser')
const { transformError } = require('../util')

let indent = '  '

async function toJSON (file, options) {
  file = file[0]

  if (options.tabs) {
    indent = '\t'
  }

  let contents

  if (!file) {
    contents = await getStdin()
    if (!contents) {
      throw new Error('No input provided via stdin')
    }
  } else {
    contents = await fs.readFile(file, 'utf8')
  }

  let representation

  try {
    representation = parser.parse(contents)
  } catch (e) {
    console.error(transformError(e).message)
    process.exit(1)
  }

  console.log(JSON.stringify(representation, null, indent))
}

module.exports = toJSON
