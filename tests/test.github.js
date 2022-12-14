'use strict';

const assert = require('assert');
const GitHub = require('../services/github');

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
      const github = new GitHub();

      await github.start();
      assert.ok(github);

      await github.stop();
      assert.ok(github);
    });

    xit('can generate a report', async function () {
      const github = new GitHub({
        // token: TEST_TOKEN
      });

      await github.start();
      assert.ok(github);

      const report = await github._getReport();
      assert.ok(report);

      await github.stop();
      assert.ok(github);
    });

    it('provides a working _GET', async function () {
      const github = new GitHub();

      await github.start();
      assert.ok(github);

      const report = await github._GET('/orgs/FabricLabs/repos');
      assert.ok(report);

      await github.stop();
      assert.ok(github);
    });

    it('can get a known issue', async function () {
      const github = new GitHub();

      await github.start();
      assert.ok(github);

      const report = await github._GET('/repos/FabricLabs/fabric/issues/1');
      assert.ok(report);

      await github.stop();
      assert.ok(github);
    });

    it('sync a known issue', async function () {
      const github = new GitHub();

      await github.start();
      assert.ok(github);

      const report = await github._getBountyAddress('FabricLabs/fabric/issues/1');
      console.log('report:', report);
      console.log('issue:', report.issue);
      assert.ok(report);
      assert.ok(report.issue);
      assert.ok(report.issue.user);
      assert.ok(report.issue.user.login);
      assert.strictEqual(report.issue.user.login, 'martindale');

      await github.stop();
      assert.ok(github);
    });
  });
});
