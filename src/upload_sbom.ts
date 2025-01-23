import * as exec from '@actions/exec'
import { getCLI } from './cli'

export type UploadSBOMParams = {
  sbomPath: string
  edgebitUrl: string
  edgebitToken: string
  imageId?: string
  imageTag?: string
  repoDigests: string[]
  sourceRepoUrl: string
  sourceCommitId: string
  baseCommitId?: string
  componentName: string
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

  for (const digest of params.repoDigests) {
    args.push('--repo-digest', digest)
  }

  args.push('--component', params.componentName)

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
