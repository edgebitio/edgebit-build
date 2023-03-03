"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const comments_1 = require("./comments");
const config_1 = require("./config");
const issues_1 = require("./issues");
const upload_sbom_1 = require("./upload_sbom");
const run = async () => {
    try {
        const { edgebitUrl, edgebitToken, repoToken, pullRequestNumber, commitSha, priorSha, owner, repo, sbomPath, } = await (0, config_1.getInputs)();
        const octokit = github.getOctokit(repoToken);
        let issueNumber;
        if (pullRequestNumber) {
            issueNumber = pullRequestNumber;
        }
        else {
            // If this is not a pull request, attempt to find a PR matching the sha
            issueNumber = await (0, issues_1.getIssueNumberFromCommitPullsList)(octokit, owner, repo, commitSha);
        }
        if (!issueNumber) {
            core.info('no issue number found, use a pull_request event, a pull event, or provide an issue input');
            core.setOutput('comment-created', 'false');
            return;
        }
        const result = await (0, upload_sbom_1.uploadSBOM)({
            edgebitUrl: edgebitUrl,
            edgebitToken: edgebitToken,
            sbomPath: sbomPath,
            sourceRepoUrl: `https://github.com/${owner}/${repo}`,
            sourceCommitId: commitSha,
            baseCommitId: priorSha,
        });
        const comment = await (0, comments_1.createComment)(octokit, owner, repo, issueNumber, result.commentBody);
        if (comment) {
            core.setOutput('comment-created', 'true');
            core.setOutput('comment-id', comment.id);
        }
        else {
            core.setOutput('comment-created', 'false');
            core.setOutput('comment-updated', 'false');
        }
    }
    catch (err) {
        if (err instanceof Error) {
            core.setFailed(err.message);
        }
    }
};
// Don't auto-execute in the test environment
if (process.env['NODE_ENV'] !== 'test') {
    run();
}
exports.default = run;
