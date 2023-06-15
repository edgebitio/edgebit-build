"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minimizeComment = exports.getComponentComments = exports.createComment = exports.updateComment = exports.getExistingCommentId = void 0;
async function getExistingCommentId(octokit, owner, repo, issueNumber, messageId) {
    const parameters = {
        owner,
        repo,
        issue_number: issueNumber,
        per_page: 100,
    };
    let found;
    for await (const comments of octokit.paginate.iterator(octokit.rest.issues.listComments, parameters)) {
        found = comments.data.find(({ body }) => {
            var _a;
            return ((_a = body === null || body === void 0 ? void 0 : body.search(messageId)) !== null && _a !== void 0 ? _a : -1) > -1;
        });
        if (found) {
            break;
        }
    }
    return found === null || found === void 0 ? void 0 : found.id;
}
exports.getExistingCommentId = getExistingCommentId;
async function updateComment(octokit, owner, repo, existingCommentId, body) {
    const updatedComment = await octokit.rest.issues.updateComment({
        comment_id: existingCommentId,
        owner,
        repo,
        body,
    });
    return updatedComment.data;
}
exports.updateComment = updateComment;
async function createComment(octokit, owner, repo, issueNumber, body) {
    const createdComment = await octokit.rest.issues.createComment({
        issue_number: issueNumber,
        owner,
        repo,
        body,
    });
    return createdComment.data;
}
exports.createComment = createComment;
async function getComponentComments(octokit, owner, repo, issueNumber, componentName) {
    const allComments = await octokit.rest.issues.listComments({
        sort: 'created',
        issue_number: issueNumber,
        owner,
        repo,
    });
    const matchingComments = allComments.data.filter((comment) => comment.body.includes(`componentName=${componentName}`));
    return matchingComments;
}
exports.getComponentComments = getComponentComments;
async function minimizeComment(octokit, owner, repo, commentId) {
    const query = `
    mutation minimizeComment($commentId: ID!, $owner: String!, $name: String!) {
      updateIssueComment(input: {id: $commentId, minimizedReason: OUTDATED, repositoryOwner: $owner, repositoryName: $name}) {
        minimizedComment {
          isMinimized
        }
      }
    }
  `;
    try {
        await octokit.graphql(query, {
            commentId: commentId,
            owner: owner,
            repo: repo,
        });
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.minimizeComment = minimizeComment;
