# Testing the invitations application

This app has some tests that check that it behaves as expected under normal use.
These are based in [Mocha](http://mochajs.org/) (as the testing framework) and [Nock](https://github.com/pgte/nock) (for mocking GitHub's Developer API).

To locally run these tests, run in a terminal:
```bash
# Install ALL dependencies (including dev ones), in case you already haven't
$ npm install
# Run the tests
$ npm test
```
