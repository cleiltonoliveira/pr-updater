"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePullRequestDescription = void 0;
const core = require('@actions/core');
const github = require('@actions/github');
const graphql_1 = require("@octokit/graphql");
function getCommitMessagesFromPullRequest(accessToken, repositoryOwner, repositoryName, pullRequestNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug('Get messages from pull request...');
        core.debug(` - accessToken: ${accessToken}`);
        core.debug(` - repositoryOwner: ${repositoryOwner}`);
        core.debug(` - repositoryName: ${repositoryName}`);
        core.debug(` - pullRequestNumber: ${pullRequestNumber}`);
        const query = `
    query commitMessages(
      $repositoryOwner: String!
      $repositoryName: String!
      $pullRequestNumber: Int!
      $numberOfCommits: Int = 100
    ) {
      repository(owner: $repositoryOwner, name: $repositoryName) {
        pullRequest(number: $pullRequestNumber) {
          commits(last: $numberOfCommits) {
            edges {
              node {
                commit {
                  message
                }
              }
            }
          }
        }
      }
    }
  `;
        const variables = {
            baseUrl: process.env['GITHUB_API_URL'] || 'https://api.github.com',
            repositoryOwner: repositoryOwner,
            repositoryName: repositoryName,
            pullRequestNumber: pullRequestNumber,
            headers: {
                authorization: `token ${accessToken}`
            }
        };
        core.debug(` - query: ${query}`);
        core.debug(` - variables: ${JSON.stringify(variables, null, 2)}`);
        const { repository } = (yield (0, graphql_1.graphql)(query, variables));
        core.debug(` - response: ${JSON.stringify(repository, null, 2)}`);
        let messages = [];
        if (repository.pullRequest) {
            messages = repository.pullRequest.commits.edges.map(function (edge) {
                return edge.node.commit.message;
            });
        }
        return messages;
    });
}
function updatePullRequestDescription() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const commitMessages = yield getCommitMessagesFromPullRequest(core.getInput('accessToken'), (_a = github.context.payload.repository.owner.name) !== null && _a !== void 0 ? _a : github.context.payload.repository.owner.login, github.context.payload.repository.name, github.context.payload.pull_request.number);
        const token = core.getInput('token', { required: true });
        const [repoOwner, repoName] = process.env.GITHUB_REPOSITORY.split('/');
        const prNum = github.context.payload.pull_request.number;
        const octokit = github.getOctokit(token);
        octokit.pulls.update({
            owner: repoOwner,
            repo: repoName,
            body: commitMessages,
            pull_number: prNum,
        });
    });
}
exports.updatePullRequestDescription = updatePullRequestDescription;
