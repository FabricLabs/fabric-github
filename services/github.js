'use strict';

const yaml = require('yaml');
const Actor = require('@fabric/core/types/actor');
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
        actors: {},
        documents: {},
        issues: {},
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
    const template = {
      type: 'FabricGitHubIssue',
      object: existing.data
    };

    var frontmatter = {};

    try {
      frontmatter = yaml.parse(template.object);
    } catch (exception) {
      // this.emit('error', `Unable to parse frontmatter: ${JSON.stringify(exception)}`);
      // frontmatter = yaml.parse(src);
    }

    return {
      address: null,
      issue: template.object,
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

  async _syncBountyAddress (target) {
    const bounty = await this._getBountyAddress(target);
    const state = Object.assign({}, this.state, bounty.meta);
    const front = yaml.stringify(state);
    const actor = new Actor({
      path: target
    });

    this._state.content.issues[actor.id] = actor.toGenericMessage();
    this.commit();

    return this;
  }

  graphQL (query, params = {}) {
    return this.octokit.graphql(query, params);
  }

  async start () {
    // TODO: attach reporter here (_beat, etc.)
    // periodically re-sync (1/~24 hours)
    await super.start();
    this._state.content.status = 'STARTED';
    await this.commit();
    return this;
  }

  async stop () {
    this._state.content.status = 'STOPPED';
    this.commit();
    await super.stop();
    return this;
  }

  async sync () {
    const report = await this._getReport();

    this._state.content.report = {
      json: report
    };

    this.commit();

    return this;
  }
}

module.exports = GitHub;
