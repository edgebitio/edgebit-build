import * as core from '@actions/core'
import * as github from '@actions/github'
import { createComment } from './comments'
import { getInputs } from './config'
import { findPRForCommit } from './issues'
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
      imageId,
      imageTag,
    } = await getInputs()

    const octokit = github.getOctokit(repoToken)

    let baseSha = priorSha
    let issueNumber: number | undefined

    if (pullRequestNumber) {
      core.info(`pull request number specified: ${pullRequestNumber}`)
      issueNumber = pullRequestNumber
    } else {
      core.info(`attempting to locate PR for commit ${commitSha}...`)
      const pr = await findPRForCommit(octokit, owner, repo, commitSha)

      if (pr) {
        core.info(`found PR #${pr.number} for commit ${commitSha}`)
        issueNumber = pr.number
        baseSha = priorSha || pr.head
      } else {
        core.info(`no PR found for commit ${commitSha}`)
      }
    }

    core.info(`uploading SBOM for:`)
    core.info(`  repo: https://github.com/${owner}/${repo}`)
    core.info(`  commit: ${commitSha}`)
    core.info(`  base commit: ${baseSha}`)

    const result = await uploadSBOM({
      edgebitUrl: edgebitUrl,
      edgebitToken: edgebitToken,
      sbomPath: sbomPath,
      sourceRepoUrl: `https://github.com/${owner}/${repo}`,
      sourceCommitId: commitSha,
      baseCommitId: baseSha,
      imageId,
      imageTag,
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
