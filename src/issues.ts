import { GitHub } from '@actions/github/lib/utils'

export async function findPRForCommit(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  commitSha: string,
): Promise<{ number: number; head: string } | null> {
  const commitPullsList = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha: commitSha,
  })

  const prs = commitPullsList.data.filter((pr) => pr.state === 'open')

  if (prs.length === 0) {
    return null
  }

  return {
    number: prs[0].number,
    head: prs[0].head.sha,
  }
}
