import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";

const ebctlVersion = "v0.0.3";

export type UploadSBOMParams = {
    sbomPath: string;
    edgebitUrl: string;
    edgebitToken: string;
    imageID?: string;
    imageTag?: string;
    sourceRepoUrl?: string;
    sourceCommitId?: string;
};

export async function uploadSBOM(params: UploadSBOMParams): Promise<void> {
    const ebctl = await getCLI();

    let args = ["upload-sbom"];

    if (params.imageID) {
        args.push("--image-id", params.imageID);
    }

    if (params.imageTag) {
        args.push("--image-tag", params.imageTag);
    }

    if (params.sourceRepoUrl) {
        args.push("--repo", params.sourceRepoUrl);
    }

    if (params.sourceCommitId) {
        args.push("--commit", params.sourceCommitId);
    }

    args.push(params.sbomPath);

    await exec.exec(ebctl, args, {
        env: {
            EDGEBIT_URL: params.edgebitUrl,
            EDGEBIT_API_KEY: params.edgebitToken,
        }
    });
}

export async function getCLI(): Promise<string> {
    const archVal = (process.arch === 'x64') ? 'x86_64' : 'arm64';
    const toolURL = `https://github.com/edgebitio/edgebit-cli/releases/download/${ebctlVersion}/edgebit-cli_Linux_${archVal}.tar.gz`;
    console.log(`Downloading ${toolURL}...`)
    const downloaded = await tc.downloadTool(toolURL);
    const extracted = await tc.extractTar(downloaded);

    return `${extracted}/ebctl`;
}