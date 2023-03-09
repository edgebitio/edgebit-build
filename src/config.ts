import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequestOpenedEvent } from '@octokit/webhooks-definitions/schema'

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
}

export async function getInputs(): Promise<Inputs> {
  const edgebitUrl = core.getInput('edgebit-url', { required: true })
  const edgebitLabels = core.getInput('labels', { required: false })
  const edgebitSource = 'github'
  const edgebitToken = core.getInput('token', { required: true })
  const repoToken = core.getInput('repo-token', { required: true })

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
  let pullRequestNumber = undefined
  const headCommit = github.context.sha

  if (github.context.eventName === 'pull_request') {
    const pullRequestPayload = github.context.payload.pu as PullRequestOpenedEvent

    baseCommit = pullRequestPayload.pull_request.base.sha
    pullRequestNumber = pullRequestPayload.number

    core.info(`pull request event:`)
    core.info(`  PR #${pullRequestPayload.number}`)
    core.info(`  base commit: ${baseCommit}`)
  } else if (github.context.issue.number) {
    core.info(`not a pull request event, but got issue number: ${github.context.issue.number}`)
    pullRequestNumber = github.context.issue.number
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
  }
}
