const core = require('@actions/core');
const github = require('@actions/github');

import { graphql } from '@octokit/graphql'

async function getCommitMessagesFromPullRequest(
  accessToken: string,
  repositoryOwner: string,
  repositoryName: string,
  pullRequestNumber: number
): Promise<string[]> {
  core.debug('Get messages from pull request...')
  core.debug(` - accessToken: ${accessToken}`)
  core.debug(` - repositoryOwner: ${repositoryOwner}`)
  core.debug(` - repositoryName: ${repositoryName}`)
  core.debug(` - pullRequestNumber: ${pullRequestNumber}`)

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
  `
  const variables = {
    baseUrl: process.env['GITHUB_API_URL'] || 'https://api.github.com',
    repositoryOwner: repositoryOwner,
    repositoryName: repositoryName,
    pullRequestNumber: pullRequestNumber,
    headers: {
      authorization: `token ${accessToken}`
    }
  }

  core.debug(` - query: ${query}`)
  core.debug(` - variables: ${JSON.stringify(variables, null, 2)}`)

  const {repository} = (await graphql(query, variables)) as any

  core.debug(` - response: ${JSON.stringify(repository, null, 2)}`)

  let messages: string[] = []

  interface EdgeItem {
    node: {
      commit: {
        message: string
      }
    }
  }

  if (repository.pullRequest) {
    messages = repository.pullRequest.commits.edges.map(function (
      edge: EdgeItem
    ): string {
      return edge.node.commit.message
    })
  }
  return messages
}

export async function updatePullRequestDescription() {

  const commitMessages = await getCommitMessagesFromPullRequest(
    core.getInput('accessToken'),
    github.context.payload.repository.owner.name ??
    github.context.payload.repository.owner.login,
    github.context.payload.repository.name,
    github.context.payload.pull_request.number
  )

  const token = core.getInput('token', { required: true });


  const [repoOwner, repoName] = (process as any).env.GITHUB_REPOSITORY.split('/');

  const prNum = github.context.payload.pull_request.number;

  const octokit = github.getOctokit(token);

  octokit.pulls.update({
    owner: repoOwner,
    repo: repoName,
    body: commitMessages,
    pull_number: prNum,
  });
}
