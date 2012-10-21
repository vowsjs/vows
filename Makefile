#
# Run all tests
#
test: 
	@@bin/vows test/*.js

.PHONY: test install
