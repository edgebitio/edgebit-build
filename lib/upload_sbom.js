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
exports.getCLI = exports.uploadSBOM = void 0;
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const ebctlVersion = 'v0.4.0';
async function uploadSBOM(params) {
    const ebctl = await getCLI();
    const args = ['upload-sbom-for-ci'];
    if (params.imageId) {
        args.push('--image-id', params.imageId);
    }
    if (params.imageTag) {
        args.push('--image-tag', params.imageTag);
    }
    if (params.componentName) {
        args.push('--component', params.componentName);
    }
    if (params.tags) {
        args.push('--tag', params.tags);
    }
    args.push('--repo', params.sourceRepoUrl);
    args.push('--commit', params.sourceCommitId);
    if (params.baseCommitId) {
        args.push('--base-commit', params.baseCommitId);
    }
    args.push(params.sbomPath);
    const output = await exec.getExecOutput(ebctl, args, {
        env: {
            EDGEBIT_URL: params.edgebitUrl,
            EDGEBIT_API_KEY: params.edgebitToken,
        },
    });
    if (output.exitCode !== 0) {
        throw new Error(`Failed to upload SBOM: ${output.stderr}`);
    }
    const outputObj = JSON.parse(output.stdout);
    return {
        commentBody: outputObj['comment_body'],
    };
}
exports.uploadSBOM = uploadSBOM;
async function getCLI() {
    const archVal = process.arch === 'x64' ? 'x86_64' : 'arm64';
    const toolURL = `https://github.com/edgebitio/edgebit-cli/releases/download/${ebctlVersion}/edgebit-cli_Linux_${archVal}.tar.gz`;
    const downloaded = await tc.downloadTool(toolURL);
    const extracted = await tc.extractTar(downloaded);
    return `${extracted}/ebctl`;
}
exports.getCLI = getCLI;
