#!/usr/bin/env node

const fs = require('fs')
const parser = require('../parser')

function usageAndExit () {
  console.error('Usage: ipldschema2json <schema.ipldsch>')
  process.exit(1)
}

if (process.argv.length < 3) {
  usageAndExit()
}

if (!fs.existsSync(process.argv[2])) {
  console.error(`Error: file '${process.argv[2]}' does not exist`)
  usageAndExit()
}

const schemaText = fs.readFileSync(process.argv[2], 'utf8')
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

console.log(JSON.stringify(representation, null, 2))
