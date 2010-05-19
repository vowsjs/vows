#
# Run all tests
#
test: 
	@@node test/vows-test.js
	@@node test/addvow-test.js

install:
	@@echo "vows: updating submodules..."
	@@git submodule update --init
	@@echo "vows: done."

.PHONY: test install
