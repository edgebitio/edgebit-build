import { GitHub } from '@actions/github/lib/utils'
import { Endpoints } from '@octokit/types'
import * as core from '@actions/core'

export type CreateIssueCommentResponseData =
  Endpoints['POST /repos/{owner}/{repo}/issues/{issue_number}/comments']['response']['data']

export async function getExistingCommentId(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  issueNumber: number,
  messageId: string,
): Promise<number | undefined> {
  const parameters = {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  }

  let found

  for await (const comments of octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    parameters,
  )) {
    found = comments.data.find(({ body }) => {
      return (body?.search(messageId) ?? -1) > -1
    })

    if (found) {
      break
    }
  }

  return found?.id
}

export async function updateComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  existingCommentId: number,
  body: string,
): Promise<CreateIssueCommentResponseData> {
  const updatedComment = await octokit.rest.issues.updateComment({
    comment_id: existingCommentId,
    owner,
    repo,
    body,
  })

  return updatedComment.data
}

export async function createComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<CreateIssueCommentResponseData> {
  const createdComment = await octokit.rest.issues.createComment({
    issue_number: issueNumber,
    owner,
    repo,
    body,
  })

  return createdComment.data
}

export async function getComponentComments(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  issueNumber: number,
  componentName: string,
): Promise<CreateIssueCommentResponseData[]> {
  const allComments = await octokit.rest.issues.listComments({
    sort: 'created',
    issue_number: issueNumber,
    owner,
    repo,
  })
  core.info(`All comments: ${allComments}`)

  const matchingComments = allComments.data.filter((comment: any) =>
    comment.body.includes(`componentName=${componentName}`),
  )
  core.info(`All Matching comments: ${matchingComments}`)

  return matchingComments
}

export async function minimizeComment(
  octokit: InstanceType<typeof GitHub>,
  nodeID: string,
): Promise<boolean> {
  const mutation = `
    mutation minimizeComment($nodeID: ID!) {
      minimizeComment(input: {subjectId: $nodeID, classifier: OUTDATED}) {
        clientMutationId
      }
    }
  `

  try {
    await octokit.graphql(mutation, {
      nodeID: nodeID,
    })

    return true
  } catch (error) {
    core.error(`GraphQL error: ${error}`)
    return false
  }
}

export async function minimizeComments(
  octokit: InstanceType<typeof GitHub>,
  comments: CreateIssueCommentResponseData[],
) {
  core.info(`ComponentComments: ${comments}`)

  for (const currentComment of comments) {
    if (currentComment) {
      try {
        const isCommentMinimized = await minimizeComment(octokit, currentComment.node_id)
        core.info(`Comment minimized: ${isCommentMinimized}`)
      } catch (error) {
        core.error(`Error minimizing comment: ${error}`)
      }
    }
  }
}
