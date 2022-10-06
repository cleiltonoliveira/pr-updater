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
exports.buildDescription = void 0;
const core = require('@actions/core');
const github = require('@actions/github');
const accessToken = core.getInput('accessToken');
const octokit = github.getOctokit(accessToken);
function validateInputs() {
    if (!accessToken) {
        throw new Error('Access token missing');
    }
    if (!github.context.payload.pull_request.number) {
        throw new Error('No number found in the pull_request.');
    }
    if (!github.context.payload.repository) {
        throw new Error('No repository found in the payload.');
    }
    if (!github.context.payload.repository.name) {
        throw new Error('No name found in the repository.');
    }
    if (!github.context.payload.repository.owner ||
        (!github.context.payload.repository.owner.login &&
            !github.context.payload.repository.owner.name)) {
        throw new Error('No owner found in the repository.');
    }
}
function buildDescription() {
    return __awaiter(this, void 0, void 0, function* () {
        validateInputs();
        const [repoOwner, repoName] = process.env.GITHUB_REPOSITORY.split('/');
        const prNum = github.context.payload.pull_request.number;
        const currentDescription = yield getCurrentPullRequestDescription(repoOwner, repoName, prNum);
        const commitMessages = yield getCommitMessages(repoOwner, repoName, prNum);
        let messagesToAppend = "";
        commitMessages.forEach(message => {
            messagesToAppend += message + "  \n";
        });
        const newDescription = `${currentDescription || ""} \n### Commit messages  \n ${messagesToAppend}`;
        octokit.rest.pulls.update({
            owner: repoOwner,
            repo: repoName,
            body: newDescription,
            pull_number: prNum
        });
    });
}
exports.buildDescription = buildDescription;
function getCommitMessages(owner, repo, pull_number) {
    return __awaiter(this, void 0, void 0, function* () {
        const commits = yield octokit.rest.pulls.listCommits({
            owner,
            repo,
            pull_number
        });
        const commitMessages = commits.data.map((item) => item.commit.message);
        core.debug(` - commitMessages: ${commitMessages}`);
        return commitMessages;
    });
}
function getCurrentPullRequestDescription(owner, repo, pull_number) {
    return __awaiter(this, void 0, void 0, function* () {
        const pr = yield octokit.rest.pulls.get({
            owner,
            repo,
            pull_number,
        });
        return pr.data.body;
    });
}
