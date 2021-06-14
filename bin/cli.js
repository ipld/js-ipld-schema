#!/usr/bin/env node

const validate = require('./validate')
const toJSON = require('./to-json')
const toSchema = require('./to-schema')
const jsonToSchema = require('./json-to-schema')

const toOpts = {
  tabs: {
    alias: 't',
    type: 'boolean',
    describe: 'print with tabs instead of spaces'
  }
}

const yargs = require('yargs')
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
