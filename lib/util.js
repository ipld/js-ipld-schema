/**
 * @param {unknown} err
 * @returns {unknown}
 */
export function transformError (err) {
  // @ts-ignore
  if ('location' in err) {
    // @ts-ignore
    err.message = `Error parsing schema @ line:${err.location.start.line} col:${err.location.start.column}: ${err.message}`
  }
  return err
}
