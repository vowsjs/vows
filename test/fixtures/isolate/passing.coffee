vows = require '../../../lib/vows'

assert = require 'assert'

obvious = null
vows.describe 'passing'

    .addBatch

        'Obvious test': obvious =

            topic: ->

                @callback null, true

            'should work': (result) ->

                assert.ok result

        'Obvious test #2': obvious

        'Obvious test #3': obvious

        'Obvious test #4': obvious

    .export module

