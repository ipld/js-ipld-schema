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

async function collectInput (files) {
  let input = []

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

  input = input.filter(({ filename, contents }) => {
    if (!contents) {
      console.error(`Ignoring "${filename}" (no IPLD Schema content)`)
      return false
    }
    return true
  })

  return input
}

module.exports = collectInput
