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
const config_1 = require("./config");
const upload_sbom_1 = require("./upload_sbom");
const run = async () => {
    try {
        const { edgebitUrl, edgebitToken, commitSha, pullRequestNumber, owner, repo, sbomPath, imageId, imageTag, repoDigests, componentName, tags, } = await (0, config_1.getInputs)();
        let prNumber;
        if (pullRequestNumber === undefined) {
            if (github.context.eventName === 'pull_request') {
                core.info(`pull request event detected`);
                const pullRequestPayload = github.context.payload;
                prNumber = pullRequestPayload.number;
            }
        }
        else {
            core.info(`pull request number specified: ${pullRequestNumber}`);
            prNumber = pullRequestNumber;
        }
        core.info(`uploading SBOM for:`);
        core.info(`  repo: https://github.com/${owner}/${repo}`);
        core.info(`  commit: ${commitSha}`);
        core.info(`  pull request: ${prNumber}`);
        await (0, upload_sbom_1.uploadSBOM)({
            edgebitUrl: edgebitUrl,
            edgebitToken: edgebitToken,
            sbomPath: sbomPath,
            sourceRepoUrl: `https://github.com/${owner}/${repo}`,
            sourceCommitId: commitSha,
            baseCommitId: undefined,
            imageId,
            imageTag,
            repoDigests,
            componentName,
            tags,
            pullRequest: prNumber ? `https://github.com/${owner}/${repo}/pull/${prNumber}` : '',
        });
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
