vows = require '../../../lib/vows'

assert = require 'assert'

# accommodate for pre 1.7.x coffee-script
# first try new notation rules
try

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

catch e

# fall back to old notation rules

    vows.describe('passing').addBatch({

        'Obvious test': obvious = 

            topic: ->

                @callback null, true

            'should work': (result) ->

                assert.ok result

        'Obvious test #2': obvious

        'Obvious test #3': obvious

        'Obvious test #4': obvious

    }).export module

