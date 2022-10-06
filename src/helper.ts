const core = require('@actions/core');
const github = require('@actions/github');

const accessToken = core.getInput('accessToken')
const octokit = github.getOctokit(accessToken);

function validateInputs() {

  if (!accessToken) {
    throw new Error('Access token missing')
  }

  if (!github.context.payload.pull_request.number) {
    throw new Error('No number found in the pull_request.')
  }

  if (!github.context.payload.repository) {
    throw new Error('No repository found in the payload.')
  }

  if (!github.context.payload.repository.name) {
    throw new Error('No name found in the repository.')
  }

  if (
    !github.context.payload.repository.owner ||
    (!github.context.payload.repository.owner.login &&
      !github.context.payload.repository.owner.name)
  ) {
    throw new Error('No owner found in the repository.')
  }
}

export async function buildDescription() {
  validateInputs()
  const [repoOwner, repoName] = (process as any).env.GITHUB_REPOSITORY.split('/');
  const prNum = github.context.payload.pull_request.number;

  const currentDescription = await getCurrentPullRequestDescription(repoOwner, repoName, prNum)
  const commitMessages: string[] = await getCommitMessages(repoOwner, repoName, prNum);

  let messagesToAppend = ""

  commitMessages.forEach(message => {
    messagesToAppend += message + "  \n"
  });

  const newDescription = `${currentDescription || ""} \n### Commit messages  \n ${messagesToAppend}`

  octokit.rest.pulls.update({
    owner: repoOwner,
    repo: repoName,
    body: newDescription,
    pull_number: prNum
  });
}

async function getCommitMessages(owner: string, repo: string, pull_number: string) {

  const commits = await octokit.rest.pulls.listCommits({
    owner,
    repo,
    pull_number
  });

  const commitMessages = commits.data.map((item: any) => item.commit.message)

  core.debug(` - commitMessages: ${commitMessages}`)

  return commitMessages
}

async function getCurrentPullRequestDescription(owner: string, repo: string, pull_number: string) {
  const pr = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number,
  });

  return pr.data.body
}