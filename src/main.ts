import * as core from '@actions/core'
import * as github from '@actions/github'
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
      componentName,
      tags,
    } = await getInputs()

    const octokit = github.getOctokit(repoToken)

    let headSha = commitSha
    let baseSha = priorSha
    let issueNumber: number | undefined

    if (pullRequestNumber) {
      core.info(`pull request number specified: ${pullRequestNumber}`)
      issueNumber = pullRequestNumber
      const { data: pullRequest } = await octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: pullRequestNumber,
      })

      if (pullRequest) {
        core.info(`found PR #${pullRequestNumber}`)
        // If the PR is open, merge_commit_sha contains the SHA of the
        // "test commit" that was checked out and the SBOM build against.
        // If the PR is merged, merge_commit_sha will contain the actual
        // merge commit. As such, it should be preferred over head.sha.
        // The GH app has logic to detect open PRs and add checks on the
        // head SHA.
        headSha = pullRequest.merge_commit_sha || pullRequest.head.sha
        baseSha = priorSha || pullRequest.base.sha
      } else {
        core.info(`no PR found for ${pullRequestNumber}`)
      }
    } else {
      core.info(`attempting to locate PR for commit ${commitSha}...`)
      const pr = await findPRForCommit(octokit, owner, repo, commitSha)

      if (pr) {
        core.info(`found PR #${pr.number} for commit ${commitSha}`)
        issueNumber = pr.number
        baseSha = priorSha || pr.base
      } else {
        core.info(`no PR found for commit ${commitSha}`)
      }
    }

    core.info(`uploading SBOM for:`)
    core.info(`  repo: https://github.com/${owner}/${repo}`)
    core.info(`  commit: ${headSha}`)
    core.info(`  base commit: ${baseSha}`)

    await uploadSBOM({
      edgebitUrl: edgebitUrl,
      edgebitToken: edgebitToken,
      sbomPath: sbomPath,
      sourceRepoUrl: `https://github.com/${owner}/${repo}`,
      sourceCommitId: headSha,
      baseCommitId: baseSha,
      imageId,
      imageTag,
      componentName,
      tags,
      pullRequest: issueNumber ? `https://github.com/${owner}/${repo}/pull/${issueNumber}` : '',
    })

    if (!issueNumber) {
      core.info(
        'no issue number found, skipping comment creation. This is expected if this is not a pull request.',
      )
      core.setOutput('comment-created', 'false')
      return
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
