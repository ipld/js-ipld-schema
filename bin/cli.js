#!/usr/bin/env node

import { validate } from './validate.js'
import { toJSON } from './to-json.js'
import { toSchema } from './to-schema.js'
import { jsonToSchema } from './json-to-schema.js'
import _yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const toOpts = {
  tabs: {
    alias: 't',
    type: 'boolean',
    describe: 'print with tabs instead of spaces'
  }
}

const yargs = _yargs(hideBin(process.argv))
  .scriptName('ipld-schema')
  .usage('$0 <cmd> [args]')
  .command('validate',
    'Accepts .ipldsch and .md files, if none are passed will read from stdin, returns exit code 0 on successful validation')
  .command('to-json',
    'Accepts .ipldsch files, if none are passed will read from stdin, prints the JSON form of the schema',
    toOpts)
  .command('to-schema',
    'Accepts .ipldsch and .md files, if none are passed will read from stdin, prints the canonical IPLD Schema form of the schema',
    toOpts)
  .command('json-to-schema',
    'Accepts .json files, if none are passed will read from stdin, prints the canonical IPLD Schema form of the schema represented by the JSON',
    toOpts)
  .showHelpOnFail(true)
  .demandCommand(1, 'must provide a valid command')
  .help()

function runCommand (fn) {
  const args = yargs.argv._.slice(1)
  fn(args, yargs.argv).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

switch (yargs.argv._[0]) {
  case 'validate':
    runCommand(validate)
    break
  case 'to-json':
    runCommand(toJSON)
    break
  case 'to-schema':
    runCommand(toSchema)
    break
  case 'json-to-schema':
    runCommand(jsonToSchema)
    break
  default:
    yargs.showHelp()
}
