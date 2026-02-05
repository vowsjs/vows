#!/usr/bin/env node

// vows.js -- command-line driver for vows test scripts
//
// Copyright 2016 fuzzy.ai <evan@fuzzy.ai>
//
// Licensed under the Apache License, Version 2.0 (the "License")
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import createDebug from 'debug'

const debug = createDebug('vows:command-line')

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    help: {
      type: 'boolean',
      short: 'h'
    }
  }
})

if (values.help) {
  console.log('Usage: vows [options] <test-files...>')
  console.log('')
  console.log('Options:')
  console.log('  -h, --help  Show this help message')
  process.exit(0)
}

const cwd = process.cwd()

let broken = 0
let successes = 0
let failures = 0

async function runTestSuite(testFileName) {
  const testPath = path.join(cwd, testFileName)
  const testUrl = pathToFileURL(testPath).href
  const module = await import(testUrl)
  const runner = module.default || module

  if (typeof runner !== 'function') {
    throw new Error(`Path ${testFileName} does not return a function`)
  }

  return new Promise((resolve, reject) => {
    runner((err, suiteBroken, suiteSuccesses, suiteFailures) => {
      if (err) {
        reject(err)
      } else if (typeof suiteBroken !== 'number') {
        reject(new Error(`suiteBroken for ${testFileName} should be a number, is ${suiteBroken}`))
      } else if (typeof suiteSuccesses !== 'number') {
        reject(
          new Error(`suiteSuccesses for ${testFileName} should be a number, is ${suiteSuccesses}`)
        )
      } else if (typeof suiteFailures !== 'number') {
        reject(
          new Error(`suiteFailures for ${testFileName} should be a number, is ${suiteFailures}`)
        )
      } else {
        debug(`Finished suite ${testFileName}: ${suiteBroken}, ${suiteSuccesses}, ${suiteFailures}`)
        broken += suiteBroken
        successes += suiteSuccesses
        failures += suiteFailures
        resolve()
      }
    })
  })
}

async function main() {
  try {
    for (const testFile of positionals) {
      await runTestSuite(testFile)
    }

    console.log('SUMMARY')
    console.log(`\tBroken:\t\t${broken}`)
    console.log(`\tSuccesses:\t${successes}`)
    console.log(`\tFailures:\t${failures}`)

    if (broken > 0 || failures > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
