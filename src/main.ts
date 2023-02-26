import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  createComment,
  CreateIssueCommentResponseData,
} from './comments'
import { getInputs } from './config'
import { getIssueNumberFromCommitPullsList } from './issues'
import { uploadSBOM } from './upload_sbom'

const run = async (): Promise<void> => {
  try {
    const {
      edgebitUrl,
      edgebitLabels,
      edgebitSource,
      edgebitToken,
      repoToken,
      pullRequestNumber,
      commitSha,
      priorSha,
      owner,
      repo,
      sbomPath,
      debug,
    } = await getInputs()

    const octokit = github.getOctokit(repoToken)

    let issueNumber

    if (pullRequestNumber) {
      issueNumber = pullRequestNumber
    } else {
      // If this is not a pull request, attempt to find a PR matching the sha
      issueNumber = await getIssueNumberFromCommitPullsList(octokit, owner, repo, commitSha)
    }

    if (!issueNumber) {
      core.info(
        'no issue number found, use a pull_request event, a pull event, or provide an issue input',
      )
      core.setOutput('comment-created', 'false')
      return
    }

    uploadSBOM({
      edgebitUrl: edgebitUrl,
      edgebitToken: edgebitToken,
      sbomPath: sbomPath,
      sourceRepoUrl: `https://github.com/${owner}/${repo}`,
      sourceCommitId: commitSha,
    });

    let comment: CreateIssueCommentResponseData | null | undefined


    const debug_message = `<details>
<summary>SBOM uploaded with this metadata</summary>

Edgebit URL: ${edgebitUrl}
EdgeBit labels: ${edgebitLabels}
EdgeBit source: ${edgebitSource}
EdgeBit build identifier: ${owner}/${repo}:${commitSha}
EdgeBit compare identier: ${owner}/${repo}:${priorSha}
SBOM location: ${sbomPath}

I would attempt to retrieve a diff message with:

    ${edgebitUrl}/sboms/diff?prior=${owner}/${repo}:${commitSha}&current=${owner}/${repo}:${priorSha}

</details>

New dependencies have 3 vulnerabilities ([view report](${edgebitUrl}/sboms)):
  - foobar - Critical - recommend version v1.1.1
  - fizzbuzz - High - recommend version v2.2.2

Other teams are already using these newly added dependencies:
  - foobar v1.0.0 ([3 teams](${edgebitUrl}/sboms))
  - foobar v2.2.0 ([5 teams](${edgebitUrl}/sboms))
`

    const message = `[View SBOM results](${edgebitUrl}/sboms) for ${commitSha}`

    if (debug == 'true') {
      var body = `${debug_message}`
    } else {
      var body = `${message}`
    }

    comment = await createComment(octokit, owner, repo, issueNumber, body)
    core.setOutput('comment-created', 'true')

    if (comment) {
      core.setOutput('comment-id', comment.id)
    } else {
      core.setOutput('comment-created', 'false')
      core.setOutput('comment-updated', 'false')
    }
  } catch (err) {
    if (err instanceof Error) {
      core.setFailed(err.message)
    }
  }
}

// Don't auto-execute in the test environment
if (process.env['NODE_ENV'] !== 'test') {
  run()
}

export default run
