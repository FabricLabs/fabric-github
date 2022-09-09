'use strict';

const assert = require('assert');
const GitHub = require('../services/github');

const TEST_TOKEN = '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';

describe('@fabric/core/types/github', function () {
  describe('GitHub', function () {
    it('is an instance of a function', function () {
      assert.strictEqual(GitHub instanceof Function, true);
    });

    it('can smoothly create an instance', function () {
      const github = new GitHub();
      assert.ok(github);
    });

    it('can start', async function () {
      const github = new GitHub({
        token: TEST_TOKEN
      });

      await github.start();
      assert.ok(github);

      await github.stop();
      assert.ok(github);
    });

    it('can generate a report', async function () {
      const github = new GitHub({
        token: TEST_TOKEN
      });

      await github.start();
      assert.ok(github);

      const report = await github._getReport();
      assert.ok(report);

      await github.stop();
      assert.ok(github);
    });
  });
});
