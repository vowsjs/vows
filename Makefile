#
# Run all tests
#
test: 
	@@node test/vows-test.js
	@@node test/addvow-test.js

.PHONY: test
