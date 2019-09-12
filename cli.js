#!/usr/bin/env node
'use strict'
const main = require('./')
const getStdin = require('get-stdin')
const fs = require('fs').promises

const getParts = str => {
  let i = 0
  let parts = []
  while (i < str.length) {
    i = str.indexOf('```', i)
    if (i === -1) break
    let line = str.slice(i, str.indexOf('\n', i))
    let type = line.slice(3).replace(/\ /g, '')
    let keepPart = type === 'ipldsch' || type === 'sh'
    let start = str.indexOf('\n', i)
    let end = str.indexOf('```', start)

    if (end === -1) throw new Error('Unclosed code block in markdown')
    if (keepPart) parts.push(str.slice(start, end))
    i = end + 3
  }
  return parts
}

const read = filename => fs.readFile(filename).then(b => b.toString())

const description = 'Parse schema. Accepts .ipldsch and .md files. If no files are sent it will read from stdin.'
const opts = () => {}
const run = async argv => {
  let input = argv._
  if (!input.length) {
    input.push(await getStdin())
  } else {
    let _input = []
    for (let filename of input) {
      if (filename.endsWith('.ipldsch')) _input.push(await read(filename))
      else if (filename.endsWith('.md')) {
        let parts = getParts(await read(filename))
        _input = _input.concat(parts)
      }
    }
    input = _input
  }
  for (let str of input) {
    console.log(main.parse(str))
  }
}

run(require('yargs')
  .usage("$0 [...input] - Accepts .ipldsch and .md files, if none are passed will read from stdin")
  .help('help')
  .argv
)

