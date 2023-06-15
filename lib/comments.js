"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.minimizeComment = exports.getComponentComments = exports.createComment = exports.updateComment = exports.getExistingCommentId = void 0;
const core = __importStar(require("@actions/core"));
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
    core.info(`All comments: ${allComments}`);
    const matchingComments = allComments.data.filter((comment) => comment.body.includes(`componentName=${componentName}`));
    core.info(`All Matching comments: ${matchingComments}`);
    return matchingComments;
}
exports.getComponentComments = getComponentComments;
async function minimizeComment(octokit, nodeID) {
    const mutation = `
    mutation minimizeComment($nodeID: ID!) {
      minimizeComment(input: {subjectId: $nodeID, classifier: OUTDATED}) {
        clientMutationId
      }
    }
  `;
    try {
        await octokit.graphql(mutation, {
            nodeID: nodeID,
        });
        return true;
    }
    catch (error) {
        core.error(`GraphQL error: ${error}`);
        return false;
    }
}
exports.minimizeComment = minimizeComment;
