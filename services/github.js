'use strict';

const yaml = require('yaml');
const Message = require('@fabric/core/types/message');
const Service = require('@fabric/core/types/service');
const { Octokit } = require('@octokit/core');

/**
 * Interact with GitHub from Fabric.
 * @extends {Service}
 */
class GitHub extends Service {
  /**
   * Create an instance of the GitHub Service.
   * @param {Object} [settings] Configuration.
   * @returns {GitHub} Instance of {@link GitHub}.
   */
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

  async _getBountyAddress (path, owner, repository, issue) {
    if (!path) path = `${owner}/${repository}/issues/${issue}`;
    const existing = await this._GET(`/repos/${path}`);
    const src = [
      `---`,
      `title: ${this.settings.title || 'Fabric Bounty Address'}`,
      `---`,
      `# TODO`
      `- [ ] Tests (@martindale)`
    ].join('\n');

    const frontmatter = yaml.parse(src);

    return {
      address: null,
      issue: existing,
      meta: frontmatter
    }
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

  async _setBountyAddress (path, owner, repository, issue) {
    const existing = await this._getBountyAddress(path, owner, repository, issue);
    const src = [
      `---`,
      `title: ${this.settings.title || 'Fabric Bounty Address'}`,
      `---`,
      `# TODO`
      `- [ ] Tests (@martindale)`
    ].join('\n');

    const frontmatter = yaml.parse(src);

    return {
      address: null,
      meta: frontmatter
    }
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
