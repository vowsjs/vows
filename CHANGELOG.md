q# Perjury change log

Perjury adheres to [Semantic Versioning](http://semver.org/).

## 1.0.4 - future

### Added

* Add engine version compatibility in package.json

### Fixed

* Fix typo in compatibility notes

## 1.0.3 - 2017-10-25

### Added

* Document using async/await in topic and teardown

## 1.0.2 - 2017-10-25

### Added

* Expand test suite coverage

## 1.0.1 - 2017-10-25

### Fixed

* Fix typo in compatibility notes

## 1.0.0 - 2017-10-25

### Added

* Document compatibility notes in README
* Expand test suite coverage
* Node 8 is now supported

### Changed

* Upgrade dependencies

### Fixed

* Fix some typos in the README's examples
* Calling plain `perjury.assert()` instead of `perjury.assert.ok()` now actually works properly

### Breaking

* If you return a Promise from a topic or a teardown, that Promise is now resolved before passing it anywhere else

## 0.4.3 - 2017-02-10

### Added

* Expand test suite coverage

## 0.4.2 - 2016-10-07

No changes from 0.4.1.

## 0.4.1 - 2016-10-07

### Changed

* Improve internal test suite behavior

## 0.4.0 - 2016-10-07

TODO

## 0.3.5 - 2016-08-31

TODO

## 0.3.4 - 2016-08-31

TODO

## 0.3.3 - 2016-08-27

TODO

## 0.3.2 - 2016-08-26

TODO

## 0.3.1 - 2016-08-26

TODO

## 0.3.0 - 2016-08-25

TODO

## 0.2.2 - 2016-08-25

TODO

## 0.2.1 - 2016-08-25

TODO

## 0.2.0 - 2016-08-25

### Added

* Initial release
