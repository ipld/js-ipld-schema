export function transformError (err) {
  if (err.location) {
    err.message = `Error parsing schema @ line:${err.location.start.line} col:${err.location.start.column}: ${err.message}`
  }
  return err
}
