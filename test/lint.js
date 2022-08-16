import chai from 'chai'
// @ts-ignore
import standard from 'standard'

/**
 * @param {Function} typedTransformer
 */
export async function lint (typedTransformer) {
  if (standard) { // not in browser
    const fn = typedTransformer.toString()
      .replace(/^/gm, '  ')
      .replace(/^ {2}function anonymous\(obj\n {2}\) \{/, 'function typedTransformerLintForm (obj) {')
      .replace(/ {2}\}$/, '}')
    const [result] = await standard.lintText(`${fn}\ntypedTransformerLintForm('')\n`)
    if (result) {
      for (const message of result.messages) {
        console.error(
          '%d:%d: %s%s%s',
          message.line || 0,
          message.column || 0,
          message.message,
          ' (' + message.ruleId + ')',
          message.severity === 1 ? ' (warning)' : ''
        )
      }
      if (result.messages.length) {
        chai.assert.fail(`Failed to lint typedTransformer function:\n${fn}`)
      }
    }
  }
}
