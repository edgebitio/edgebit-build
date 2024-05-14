import * as core from '@actions/core'
import * as github from '@actions/github'
import { getInputs } from './config'
import { uploadSBOM } from './upload_sbom'
import { PullRequestEvent } from '@octokit/webhooks-definitions/schema'

const run = async (): Promise<void> => {
  try {
    const {
      edgebitUrl,
      edgebitToken,
      commitSha,
      pullRequestNumber,
      owner,
      repo,
      sbomPath,
      imageId,
      imageTag,
      repoDigests,
      componentName,
      tags,
    } = await getInputs()

    let prNumber: number | undefined

    if (pullRequestNumber === undefined) {
      if (github.context.eventName === 'pull_request') {
        core.info(`pull request event detected`)
        const pullRequestPayload = github.context.payload as PullRequestEvent

        prNumber = pullRequestPayload.number
      }
    } else {
      core.info(`pull request number specified: ${pullRequestNumber}`)
      prNumber = pullRequestNumber
    }

    core.info(`uploading SBOM for:`)
    core.info(`  repo: https://github.com/${owner}/${repo}`)
    core.info(`  commit: ${commitSha}`)
    core.info(`  pull request: ${prNumber}`)

    await uploadSBOM({
      edgebitUrl: edgebitUrl,
      edgebitToken: edgebitToken,
      sbomPath: sbomPath,
      sourceRepoUrl: `https://github.com/${owner}/${repo}`,
      sourceCommitId: commitSha,
      baseCommitId: undefined,
      imageId,
      imageTag,
      repoDigests,
      componentName,
      tags,
      pullRequest: prNumber ? `https://github.com/${owner}/${repo}/pull/${prNumber}` : '',
    })
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
