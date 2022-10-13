'use strict';

const Service = require('@fabric/core/types/service');
const { Octokit } = require('@octokit/core');

class GitHub extends Service {
  constructor (settings = {}) {
    super(settings);

    this.settings = Object.assign({
      targets: [
        'FabricLabs',
        'martindale'
      ],
      token: null
    }, this.settings, settings);

    this.octokit = new Octokit({ auth: this.settings.token });

    this._state = {
      content: {
        report: {}
      }
    };

    return this;
  }

  get targets () {
    return this.settings.targets;
  }

  set targets (value) {
    return false;
  }

  async _GET (path, params = {}) {
    return this.octokit.request(`GET ${path}`, params);
  }

  async _getOrganizationRepositoryCount (name) {
    const response = await this.graphQL(`query ($login: String!) {
      organization(login: $login) {
        repositories(privacy: PRIVATE) {
          totalCount
        }
      }
    }`, { login: name });

    return response.organization.repositories.totalCount;
  }

  async _getReport () {
    const count = await this._getOrganizationRepositoryCount(this.targets[0]);
    const report = {
      meta: {
        repositories: {
          count: count
        }
      }
    };

    return `${JSON.stringify(report, null, '  ')}`;
  }

  graphQL (query, params = {}) {
    return this.octokit.graphql(query, params);
  }

  async start () {
    // TODO: attach reporter here (_beat, etc.)
    // periodically re-sync (1/~24 hours)
    await super.start();
    return this;
  }

  async sync () {
    const report = await this._getReport();

    this.state.report = {
      json: report
    };

    this.commit();

    return this;
  }
}

module.exports = GitHub;
