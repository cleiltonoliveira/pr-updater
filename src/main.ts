import * as helper from "./helper"
const core = require('@actions/core');
const github = require('@actions/github');

core.debug(` - eventName: ${github.context.eventName}`)

switch (github.context.eventName) {
    case 'pull_request_target':
    case 'pull_request':
        helper.buildDescription();
}
