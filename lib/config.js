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
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function getInput(name, overrides, required) {
    const val = overrides[name] || undefined;
    if (val !== undefined) {
        return val;
    }
    return core.getInput(name, { required });
}
function readOverrides() {
    try {
        const argsFile = core.getInput('args-file', { required: false }) || undefined;
        if (argsFile) {
            const str = fs.readFileSync(argsFile, 'utf-8');
            return JSON.parse(str);
        }
    }
    catch (err) {
        // fallthrough to return an empty dict
    }
    return {};
}
async function getInputs() {
    var _a;
    const args = readOverrides();
    const edgebitUrl = getInput('edgebit-url', args, true);
    const edgebitLabels = getInput('labels', args, false);
    const edgebitSource = 'github';
    const edgebitToken = getInput('token', args, true);
    const repoToken = getInput('repo-token', args, true);
    const imageId = getInput('image-id', args, false) || undefined;
    const imageTag = getInput('image-tag', args, false) || undefined;
    const repoDigestsJoined = getInput('repo-digest', args, false) || undefined;
    const componentName = getInput('component', args, true);
    const tagsJoined = getInput('tags', args, false) || undefined;
    const commitSha = getInput('commit-sha', args, false) || github.context.sha;
    const pullRequestNumber = parseInt(getInput('pr-number', args, false)) || undefined;
    if (!edgebitUrl) {
        throw new Error('no EdgeBit URL specified, please specify an EdgeBit URL');
    }
    if (!componentName) {
        throw new Error('no component name specified, please specify a component name');
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
    const [owner, repo] = repoFullName.split('/');
    const repoDigests = repoDigestsJoined === undefined
        ? []
        : repoDigestsJoined
            .split(',')
            .map((d) => d.trim())
            .filter((d) => d.length > 0);
    const tags = tagsJoined === undefined
        ? []
        : tagsJoined
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
    return {
        edgebitUrl,
        edgebitLabels,
        edgebitSource,
        edgebitToken,
        repoToken,
        commitSha,
        pullRequestNumber,
        owner,
        repo,
        sbomPath,
        imageId,
        imageTag,
        repoDigests,
        componentName,
        tags,
    };
}
exports.getInputs = getInputs;
