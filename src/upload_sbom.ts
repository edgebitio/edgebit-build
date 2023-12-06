import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'

const ebctlVersion = 'v0.6.1'

export type UploadSBOMParams = {
  sbomPath: string
  edgebitUrl: string
  edgebitToken: string
  imageId?: string
  imageTag?: string
  sourceRepoUrl: string
  sourceCommitId: string
  baseCommitId?: string
  componentName?: string
  tags: string[]
  pullRequest?: string
}

export async function uploadSBOM(params: UploadSBOMParams) {
  const ebctl = await getCLI()

  const args = ['upload-sbom']

  if (params.imageId) {
    args.push('--image-id', params.imageId)
  }

  if (params.imageTag) {
    args.push('--image-tag', params.imageTag)
  }

  if (params.componentName) {
    args.push('--component', params.componentName)
  }

  for (const tag of params.tags) {
    args.push('--tag', tag)
  }

  args.push('--repo', params.sourceRepoUrl)
  args.push('--commit', params.sourceCommitId)

  if (params.pullRequest) {
    args.push('--pull-request', params.pullRequest)
  }

  args.push(params.sbomPath)

  const output = await exec.getExecOutput(ebctl, args, {
    env: {
      EDGEBIT_URL: params.edgebitUrl,
      EDGEBIT_API_KEY: params.edgebitToken,
    },
  })

  if (output.exitCode !== 0) {
    throw new Error(`Failed to upload SBOM: ${output.stderr}`)
  }
}

export async function getCLI(): Promise<string> {
  const archVal = process.arch === 'x64' ? 'x86_64' : 'arm64'
  const toolURL = `https://github.com/edgebitio/edgebit-cli/releases/download/${ebctlVersion}/edgebit-cli_Linux_${archVal}.tar.gz`
  const downloaded = await tc.downloadTool(toolURL)
  const extracted = await tc.extractTar(downloaded)

  return `${extracted}/ebctl`
}
