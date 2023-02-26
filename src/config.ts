import * as core from '@actions/core'
import * as github from '@actions/github'
import {PushEvent, PullRequestOpenedEvent} from '@octokit/webhooks-definitions/schema'

interface Inputs {
  edgebitUrl: string
  edgebitLabels: string
  edgebitSource: string
  edgebitToken: string
  repoToken: string
  commitSha: string
  priorSha: any
  pullRequestNumber?: number
  repo: string
  owner: string
  sbomPath: string
  debug: string
}

export async function getInputs(): Promise<Inputs> {
  const edgebitUrl = core.getInput('edgebit-url', { required: true });
  const edgebitLabels = core.getInput('labels', { required: false });
  const edgebitSource = 'github';
  const edgebitToken = core.getInput('token', { required: true });
  const repoToken = core.getInput('repo-token', { required: true });
  const debug = core.getInput('debug', { required: false });

  if (!edgebitUrl) {
    throw new Error('no EdgeBit URL specified, please specify an EdgeBit URL');
  }

  const sbomPath = core.getInput('sbom-file', { required: false }) || process.env.ANCHORE_SBOM_ACTION_SBOM_FILE;

  if (!sbomPath) {
    throw new Error('no SBOM file specified, please specify an SBOM file');
  }

  const { payload } = github.context

  const repoFullName = payload.repository?.full_name

  if (!repoFullName) {
    throw new Error('unable to determine repository from request type')
  }

  var baseCommit = ''
  var headCommit = ''
  if (github.context.eventName === 'pull_request') {
    const pullRequestPayload = github.context.payload as PullRequestOpenedEvent
    baseCommit = pullRequestPayload.pull_request.base.sha;
    headCommit = pullRequestPayload.pull_request.head.sha;
  } else if (github.context.eventName === 'push') {
    const pushPayload = github.context.payload as PushEvent
    baseCommit = pushPayload.before;
    headCommit = github.context.sha;
  }

  const [owner, repo] = repoFullName.split('/')

  return {
    edgebitUrl,
    edgebitLabels,
    edgebitSource,
    edgebitToken,
    repoToken,
    pullRequestNumber: payload.pull_request?.number,
    commitSha: headCommit,
    priorSha: baseCommit,
    owner,
    repo,
    sbomPath,
    debug,
  }
}
