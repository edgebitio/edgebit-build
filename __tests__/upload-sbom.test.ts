import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import { PullRequestEvent, PullRequestOpenedEvent } from '@octokit/webhooks-definitions/schema'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import run from '../src/main'
import * as cli from '../src/cli'

const repoFullName = 'foo/bar'
const commitSha = 'abc123'

type Inputs = {
  'repo-token': string
  'edgebit-url': string
  'token': string
  'sbom-file': string
  'repo-digest': string
  'component': string
}

const inputs: Inputs = {
  'edgebit-url': 'https://test.edgebit.io',
  'token': 'test-token',
  'repo-token': '',
  'sbom-file': 'sbom.spdx.json',
  'repo-digest': 'foo/bar@sha256:12345, foo/bar@sha256:67890',
  'component': 'foo/bar',
}

function expectedArgs() {
  let args = [
      'upload-sbom',
      '--repo-digest',
      'foo/bar@sha256:12345',
      '--repo-digest',
      'foo/bar@sha256:67890',
      '--component',
      'foo/bar',
      '--repo',
      'https://github.com/foo/bar',
      '--commit',
      inputs['commit-sha'] || 'abc123',
  ];

  let prNumber = inputs['pr-number']
  if (prNumber === undefined) {
    if (github.context.eventName === 'pull_request') {
      const pullRequestPayload = github.context.payload as PullRequestEvent
      prNumber = pullRequestPayload.number
    }
  }

  if (prNumber) {
    args.push('--pull-request', `https://github.com/foo/bar/pull/${prNumber}`)
  }

  args.push('sbom.spdx.json')
  return args
}

function expectedEnv() {
  return {
    env: {
      EDGEBIT_URL: 'https://test.edgebit.io',
      EDGEBIT_API_KEY: 'test-token'
    }
  };
}

let issueNumber = 1

vi.mock('@actions/core')
vi.mock('@actions/exec')
vi.mock('../src/cli')

describe('upload-sbom action', () => {
  beforeEach(() => {
    issueNumber = 1
    vi.resetModules()

    vi.spyOn(exec, 'getExecOutput').mockResolvedValue({
      exitCode: 0,
      stdout: '',
      stderr: '',
    });

    github.context.sha = commitSha

    // https://developer.github.com/webhooks/event-payloads/#issues
    github.context.payload = {
      number: issueNumber,
      repository: {
        full_name: repoFullName,
        name: 'bar',
        owner: {
          login: 'bar',
        },
      },
    } as PullRequestOpenedEvent 
  })

  afterEach(() => {
    vi.clearAllMocks()
    delete inputs['pr-number']
    delete inputs['commit-sha']
    github.context.eventName = ''
  })

  vi.mocked(core.getInput).mockImplementation((name: string, options?: core.InputOptions) => {
    const value = inputs[name] ?? ''

    if (options?.required && value === undefined) {
      throw new Error(`${name} is required`)
    }

    return value
  })

  
  vi.mocked(cli.getCLI).mockImplementation(async () => {
    return 'ebctl'
  })
  

  it('uploads an SBOM from pull request auto detected', async () => {
    github.context.eventName = 'pull_request'

    await expect(run()).resolves.not.toThrow()
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(exec.getExecOutput).toHaveBeenCalledWith(
      'ebctl',
      expectedArgs(),
      expectedEnv(),
    )
  })

  it('uploads an SBOM from pull request number specified', async () => {
    github.context.eventName = 'pull_request'
    inputs['pr-number'] = '2'
    
    await expect(run()).resolves.not.toThrow()
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(exec.getExecOutput).toHaveBeenCalledWith(
      'ebctl',
      expectedArgs(),
      expectedEnv(),
    )
  })

  it('uploads an SBOM from push', async () => {
    github.context.eventName = 'push'

    await expect(run()).resolves.not.toThrow()
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(exec.getExecOutput).toHaveBeenCalledWith(
      'ebctl',
      expectedArgs(),
      expectedEnv(),
    )
  })

  it('uploads an SBOM with explicit commit-sha', async () => {
    github.context.eventName = 'push'
    inputs['commit-sha'] = 'bca321'

    await expect(run()).resolves.not.toThrow()
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(exec.getExecOutput).toHaveBeenCalledWith(
      'ebctl',
      expectedArgs(),
      expectedEnv(),
    )
  })
})
