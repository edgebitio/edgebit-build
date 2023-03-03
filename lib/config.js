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
exports.getInputs = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
async function getInputs() {
    var _a, _b;
    const edgebitUrl = core.getInput('edgebit-url', { required: true });
    const edgebitLabels = core.getInput('labels', { required: false });
    const edgebitSource = 'github';
    const edgebitToken = core.getInput('token', { required: true });
    const repoToken = core.getInput('repo-token', { required: true });
    if (!edgebitUrl) {
        throw new Error('no EdgeBit URL specified, please specify an EdgeBit URL');
    }
    const sbomPath = core.getInput('sbom-file', { required: false }) || process.env.ANCHORE_SBOM_ACTION_SBOM_FILE;
    if (!sbomPath) {
        throw new Error('no SBOM file specified, please specify an SBOM file');
    }
    const { payload } = github.context;
    const repoFullName = (_a = payload.repository) === null || _a === void 0 ? void 0 : _a.full_name;
    if (!repoFullName) {
        throw new Error('unable to determine repository from request type');
    }
    let baseCommit = '';
    let headCommit = '';
    if (github.context.eventName === 'pull_request') {
        const pullRequestPayload = github.context.payload;
        baseCommit = pullRequestPayload.pull_request.base.sha;
        headCommit = pullRequestPayload.pull_request.head.sha;
    }
    else if (github.context.eventName === 'push') {
        const pushPayload = github.context.payload;
        baseCommit = pushPayload.before;
        headCommit = github.context.sha;
    }
    const [owner, repo] = repoFullName.split('/');
    return {
        edgebitUrl,
        edgebitLabels,
        edgebitSource,
        edgebitToken,
        repoToken,
        pullRequestNumber: (_b = payload.pull_request) === null || _b === void 0 ? void 0 : _b.number,
        commitSha: headCommit,
        priorSha: baseCommit,
        owner,
        repo,
        sbomPath,
    };
}
exports.getInputs = getInputs;
