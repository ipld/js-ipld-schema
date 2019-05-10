#!/usr/bin/env node

const fs = require('fs')
const parser = require('../parser')

let args = process.argv.slice(2)
let indent = ' '

function usageAndExit () {
  console.error('Usage: ipldschema2json [-t] <schema.ipldsch>')
  process.exit(1)
}

if (args[0] === '-t') {
  indent = '\t'
  args = args.slice(1)
}

if (!args.length) {
  usageAndExit()
}

if (!fs.existsSync(args[0])) {
  console.error(`Error: file '${args[0]}' does not exist`)
  usageAndExit()
}

const schemaText = fs.readFileSync(args[0], 'utf8')
let representation

try {
  representation = parser.parse(schemaText)
} catch (e) {
  if (e.location) {
    console.error(`Error parsing schema @ line:${e.location.start.line} col:${e.location.start.column}:`, e.message)
  } else {
    console.error(e)
  }
  process.exit(1)
}

console.log(JSON.stringify(representation, null, indent))
