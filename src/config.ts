import * as fs from 'fs'
import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequestOpenedEvent, WorkflowRun } from '@octokit/webhooks-definitions/schema'

interface Inputs {
  edgebitUrl: string
  edgebitLabels: string
  edgebitSource: string
  edgebitToken: string
  repoToken: string
  commitSha: string
  priorSha: string | undefined
  pullRequestNumber?: number
  repo: string
  owner: string
  sbomPath: string
  imageId: string | undefined
  imageTag: string | undefined
  componentName?: string
  tags?: string
  postComment: boolean
}

function getInput(name: string, overrides: { [key: string]: string }, required: boolean): string {
  const val = overrides[name] || undefined
  if (val !== undefined) {
    return val
  }

  return core.getInput(name, { required })
}

function parseBool(val: string, defVal: boolean): boolean {
  switch (val.toLowerCase()) {
    case 'true':
      return true
    case 'false':
      return false
    default:
      return defVal
  }
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
  const tags = getInput('tags', args, false) || undefined
  const postComment = parseBool(getInput('post-comment', args, false), false)
  let pullRequestNumber = parseInt(getInput('pr-number', args, false)) || undefined

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

  let baseCommit = undefined
  const headCommit = github.context.sha

  if (pullRequestNumber === undefined) {
    if (github.context.eventName === 'pull_request') {
      const pullRequestPayload = github.context.payload as PullRequestOpenedEvent

      baseCommit = pullRequestPayload.pull_request.base.sha
      pullRequestNumber = pullRequestPayload.number

      core.info(`pull request event:`)
      core.info(`  PR #${pullRequestPayload.number}`)
      core.info(`  base commit: ${baseCommit}`)
    } else if (github.context.eventName === 'workflow_run') {
      const workflowPayload = github.context.payload as WorkflowRun

      baseCommit = workflowPayload.head_sha

      core.info(`workflow run event:`)
      core.info(`  base commit: ${baseCommit}`)
    } else if (github.context.issue.number) {
      core.info(`not a pull request event, but got issue number: ${github.context.issue.number}`)
      pullRequestNumber = github.context.issue.number
    }
  }

  const [owner, repo] = repoFullName.split('/')

  return {
    edgebitUrl,
    edgebitLabels,
    edgebitSource,
    edgebitToken,
    repoToken,
    pullRequestNumber: pullRequestNumber,
    commitSha: headCommit,
    priorSha: baseCommit,
    owner,
    repo,
    sbomPath,
    imageId,
    imageTag,
    componentName,
    tags,
    postComment,
  }
}
