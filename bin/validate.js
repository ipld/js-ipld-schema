const parser = require('../parser')
const { transformError } = require('../util')
const getStdin = require('get-stdin')
const fs = require('fs').promises

function stripMarkdown (str) {
  str = str.split('\n')
  const stripped = []
  let inBlock = false
  let blockCount = 0

  for (const line of str) {
    if (inBlock && /^\s*```/.test(line)) {
      inBlock = false
      stripped.push('')
    } else if (inBlock) {
      stripped.push(line)
    } else if (/^\s*```\s*(ipldsch|sh)\s*$/.test(line)) {
      inBlock = true
      blockCount++
      stripped.push('')
    } else {
      stripped.push('')
    }
  }

  return blockCount ? stripped.join('\n') : ''
}

async function read (filename) {
  return fs.readFile(filename, 'utf8')
}

async function validate (files) {
  const input = []
  if (!files.length) {
    const contents = await getStdin()
    if (!contents) {
      throw new Error('No input provided via stdin')
    }
    input.push({ filename: '<stdin>', contents })
  } else {
    for (const filename of files) {
      if (filename.endsWith('.ipldsch')) {
        input.push({ filename, contents: await read(filename) })
      } else if (filename.endsWith('.md')) {
        input.push({ filename, contents: stripMarkdown(await read(filename)) })
      } else {
        console.error(`Ignoring "${filename}" (wrong suffix)`)
      }
    }
  }

  for (const { filename, contents } of input) {
    if (!contents) {
      console.error(`File ${filename} has no IPLD schema contents`)
      continue
    }
    try {
      parser.parse(contents)
    } catch (err) {
      throw new Error(`Could not validate ${filename}: ${transformError(err).message}`) // discard useless extra info
    }
    console.error(`Validated ${filename} ...`)
  }
}

module.exports = validate
