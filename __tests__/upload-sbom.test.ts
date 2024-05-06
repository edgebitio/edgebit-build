import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import { PullRequestOpenedEvent } from '@octokit/webhooks-definitions/schema'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import run from '../src/main'
import * as cli from '../src/cli'

const repoFullName = 'foo/bar'
const repoToken = '12345'
const commitSha = 'abc123'
const simpleMessage = 'hello world'

type Inputs = {
  'repo-token': string
  'edgebit-url': string
  'token': string
  'sbom-file': string
}

const inputs: Inputs = {
  'edgebit-url': 'https://test.edgebit.io',
  'token': 'test-token',
  'repo-token': '',
  'sbom-file': 'sbom.spdx.json',
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
    expect(exec.getExecOutput).toHaveBeenCalledWith('ebctl', [
      'upload-sbom',
      '--repo',
      'https://github.com/foo/bar',
      '--commit',
      'abc123',
      '--pull-request',
      'https://github.com/foo/bar/pull/1',
      'sbom.spdx.json'
    ], {
      env: {
        EDGEBIT_URL: 'https://test.edgebit.io',
        EDGEBIT_API_KEY: 'test-token'
      }
    })
  })

  it('uploads an SBOM from pull request number specified', async () => {
    github.context.eventName = 'pull_request'
    inputs['pr-number'] = '2'
    
    await expect(run()).resolves.not.toThrow()
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(exec.getExecOutput).toHaveBeenCalledWith('ebctl', [
      'upload-sbom',
      '--repo',
      'https://github.com/foo/bar',
      '--commit',
      'abc123',
      '--pull-request',
      'https://github.com/foo/bar/pull/2',
      'sbom.spdx.json'
    ], {
      env: {
        EDGEBIT_URL: 'https://test.edgebit.io',
        EDGEBIT_API_KEY: 'test-token'
      }
    })
  })

  it('uploads an SBOM from push', async () => {
    github.context.eventName = 'push'

    await expect(run()).resolves.not.toThrow()
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(exec.getExecOutput).toHaveBeenCalledWith('ebctl', [
      'upload-sbom',
      '--repo',
      'https://github.com/foo/bar',
      '--commit',
      'abc123',
      'sbom.spdx.json'
    ], {
      env: {
        EDGEBIT_URL: 'https://test.edgebit.io',
        EDGEBIT_API_KEY: 'test-token'
      }
    })
  })
})
