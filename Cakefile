# Cakefile -- build file for fuzzy.io packages
#
# Copyright 2016 fuzzy.io <evan@fuzzy.io>
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

fs = require 'fs'

{spawn} = require 'child_process'

glob = require 'glob'

cmd = (str, callback) ->
  parts = str.split(' ')
  main = parts[0]
  rest = parts.slice(1)
  proc = spawn main, rest
  proc.stderr.on 'data', (data) ->
    process.stderr.write data.toString()
  proc.stdout.on 'data', (data) ->
    process.stdout.write data.toString()
  proc.on 'exit', (code) ->
    callback?() if code is 0

build = (callback) ->
  cmd 'coffee -c -o lib src', ->
    cmd 'coffee -c test', ->
      callback?()

task 'build', 'Build lib/ from src/', ->
  build()

task 'clean', 'Clean up extra files', ->
  patterns = ["lib/*.js", "test/*.js", "*~", "lib/*~", "src/*~", "test/*~"]
  for pattern in patterns
    glob pattern, (err, files) ->
      for file in files
        fs.unlinkSync file
