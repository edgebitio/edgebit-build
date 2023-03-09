import * as core from '@actions/core'
import * as github from '@actions/github'
import { createComment } from './comments'
import { getInputs } from './config'
import { getIssueNumberFromCommitPullsList } from './issues'
import { uploadSBOM } from './upload_sbom'

const run = async (): Promise<void> => {
  try {
    const {
      edgebitUrl,
      edgebitToken,
      repoToken,
      pullRequestNumber,
      commitSha,
      priorSha,
      owner,
      repo,
      sbomPath,
    } = await getInputs()

    const octokit = github.getOctokit(repoToken)

    let issueNumber

    if (pullRequestNumber) {
      issueNumber = pullRequestNumber
    } else {
      // If this is not a pull request, attempt to find a PR matching the sha
      issueNumber = await getIssueNumberFromCommitPullsList(octokit, owner, repo, commitSha)
    }

    const result = await uploadSBOM({
      edgebitUrl: edgebitUrl,
      edgebitToken: edgebitToken,
      sbomPath: sbomPath,
      sourceRepoUrl: `https://github.com/${owner}/${repo}`,
      sourceCommitId: commitSha,
      baseCommitId: priorSha,
    })

    if (!issueNumber) {
      core.info(
        'no issue number found, skipping comment creation. This is expected if this is not a pull request.',
      )
      core.setOutput('comment-created', 'false')
      return
    }

    const comment = await createComment(octokit, owner, repo, issueNumber, result.commentBody)

    if (comment) {
      core.setOutput('comment-created', 'true')
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
