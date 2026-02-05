// report.test.js -- Tests for the Report class
//
// Copyright 2017-2026 fuzzy.ai, vowsjs contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
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

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { Report } from '../src/report.js'

describe('Report', () => {
  test('initializes with correct defaults', () => {
    const report = new Report('Test Report')

    assert.equal(report.title, 'Test Report')
    assert.equal(report.broken, 0)
    assert.equal(report.successes, 0)
    assert.equal(report.failures, 0)
    assert.deepEqual(report.tests, {})
    assert.deepEqual(report.subs, {})
  })

  test('addSub adds sub-report and accumulates stats', () => {
    const parent = new Report('Parent')
    const child = new Report('Child')

    child.broken = 1
    child.successes = 5
    child.failures = 2

    parent.addSub('Child', child)

    assert.equal(parent.subs.Child, child)
    assert.equal(parent.broken, 1)
    assert.equal(parent.successes, 5)
    assert.equal(parent.failures, 2)
  })

  test('accumulates stats from multiple sub-reports', () => {
    const parent = new Report('Parent')

    const child1 = new Report('Child 1')
    child1.broken = 0
    child1.successes = 3
    child1.failures = 1

    const child2 = new Report('Child 2')
    child2.broken = 1
    child2.successes = 2
    child2.failures = 0

    parent.addSub('Child 1', child1)
    parent.addSub('Child 2', child2)

    assert.equal(parent.broken, 1)
    assert.equal(parent.successes, 5)
    assert.equal(parent.failures, 1)
  })
})
