#!/usr/bin/env node

// perjury.js -- command-line driver for perjury test scripts
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

/* jshint esversion: 6 */

'use strict'

const path = require('path')

const _ = require('lodash')
const async = require('async')
const debug = require('debug')('perjury:command-line')

// This registers a hook so that coffeescript modules can be loaded

require('coffee-script/register')

const {argv} = require('yargs')
  .help('h')

const cwd = process.cwd()

let broken = 0
let successes = 0
let failures = 0

const runTestSuite = (testFileName, callback) => {
  const testPath = path.join(cwd, testFileName)
  const runner = require(testPath)
  if (!_.isFunction(runner)) {
    callback(new Error(`Path ${testFileName} does not return a function`))
  } else {
    runner((err, suiteBroken, suiteSuccesses, suiteFailures) => {
      if (err) {
        callback(err)
      } else if (!_.isNumber(suiteBroken)) {
        callback(new Error(`suiteBroken for ${testFileName} should be a number, is ${suiteBroken}`))
      } else if (!_.isNumber(suiteSuccesses)) {
        callback(new Error(`suiteSuccesses for ${testFileName} should be a number, is ${suiteSuccesses}`))
      } else if (!_.isNumber(suiteFailures)) {
        callback(new Error(`suiteFailures for ${testFileName} should be a number, is ${suiteFailures}`))
      } else {
        debug(`Finished suite ${testFileName}: ${suiteBroken}, ${suiteSuccesses}, ${suiteFailures}`)
        broken += suiteBroken
        successes += suiteSuccesses
        failures += suiteFailures
        callback(null)
      }
    })
  }
}

async.eachSeries(argv._, runTestSuite, (err) => {
  if (err) {
    console.error(err)
  } else {
    console.log('SUMMARY')
    console.log(`\tBroken:\t\t${broken}`)
    console.log(`\tSuccesses:\t${successes}`)
    console.log(`\tFailures:\t${failures}`)
    if (broken > 0 || failures > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }
  }
})
