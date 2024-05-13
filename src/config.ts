import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'

interface Inputs {
  edgebitUrl: string
  edgebitLabels: string
  edgebitSource: string
  edgebitToken: string
  repoToken: string
  commitSha: string
  pullRequestNumber?: number
  repo: string
  owner: string
  sbomPath: string
  imageId: string | undefined
  imageTag: string | undefined
  componentName?: string
  tags: string[]
}

function getInput(name: string, overrides: { [key: string]: string }, required: boolean): string {
  const val = overrides[name] || undefined
  if (val !== undefined) {
    return val
  }

  return core.getInput(name, { required })
}

function readOverrides(): { [key: string]: string } {
  try {
    const argsFile = core.getInput('args-file', { required: false }) || undefined
    if (argsFile) {
      const str = fs.readFileSync(argsFile, 'utf-8')
      return JSON.parse(str)
    }
  } catch (err) {
    // fallthrough to return an empty dict
  }

  return {}
}

export async function getInputs(): Promise<Inputs> {
  const args = readOverrides()

  const edgebitUrl = getInput('edgebit-url', args, true)
  const edgebitLabels = getInput('labels', args, false)
  const edgebitSource = 'github'
  const edgebitToken = getInput('token', args, true)
  const repoToken = getInput('repo-token', args, true)
  const imageId = getInput('image-id', args, false) || undefined
  const imageTag = getInput('image-tag', args, false) || undefined
  const componentName = getInput('component', args, false) || undefined
  const tagsJoined = getInput('tags', args, false) || undefined
  const pullRequestNumber = parseInt(getInput('pr-number', args, false)) || undefined

  if (!edgebitUrl) {
    throw new Error('no EdgeBit URL specified, please specify an EdgeBit URL')
  }

  const sbomPath =
    core.getInput('sbom-file', { required: false }) || process.env.ANCHORE_SBOM_ACTION_SBOM_FILE

  if (!sbomPath) {
    throw new Error('no SBOM file specified, please specify an SBOM file')
  }

  const { payload } = github.context

  const repoFullName = payload.repository?.full_name

  if (!repoFullName) {
    throw new Error('unable to determine repository from request type')
  }

  const [owner, repo] = repoFullName.split('/')

  const tags =
    tagsJoined === undefined
      ? []
      : tagsJoined
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0)

  return {
    edgebitUrl,
    edgebitLabels,
    edgebitSource,
    edgebitToken,
    repoToken,
    commitSha: github.context.sha,
    pullRequestNumber,
    owner,
    repo,
    sbomPath,
    imageId,
    imageTag,
    componentName,
    tags,
  }
}
