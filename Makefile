#
# Run all tests
#
test: 
	@@bin/vows test/vows-test.js test/other-test.js

.PHONY: test install
