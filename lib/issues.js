"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPRForCommit = void 0;
async function findPRForCommit(octokit, owner, repo, commitSha) {
    const commitPullsList = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
        owner,
        repo,
        commit_sha: commitSha,
    });
    const prs = commitPullsList.data.filter((pr) => pr.state === 'open');
    if (prs.length === 0) {
        return null;
    }
    return {
        number: prs[0].number,
        head: prs[0].head.sha,
    };
}
exports.findPRForCommit = findPRForCommit;
