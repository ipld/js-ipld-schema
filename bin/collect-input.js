import getStdin from 'get-stdin'
import fs from 'fs'

/**
 * @param {string} strInp
 * @returns {string}
 */
function stripMarkdown (strInp) {
  const str = strInp.split('\n')
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

/**
 * @param {string} filename
 * @returns {Promise<string>}
 */
async function read (filename) {
  return fs.promises.readFile(filename, 'utf8')
}

/**
 * @param {string[]} files
 * @returns {Promise<{ filename: string, contents: string }[]>}
 */
export async function collectInput (files) {
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
