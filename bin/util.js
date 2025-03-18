import { readFile } from 'fs/promises'

export async function pkgDecjsor () {
  const p = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  return `${p.name}@v${p.version}`
}
