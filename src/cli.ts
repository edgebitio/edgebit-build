import * as tc from '@actions/tool-cache'

const ebctlVersion = 'v0.9.0'

export async function getCLI(): Promise<string> {
  const archVal = process.arch === 'x64' ? 'x86_64' : 'arm64'
  const toolURL = `https://github.com/edgebitio/edgebit-cli/releases/download/${ebctlVersion}/edgebit-cli_Linux_${archVal}.tar.gz`
  const downloaded = await tc.downloadTool(toolURL)
  const extracted = await tc.extractTar(downloaded)

  return `${extracted}/ebctl`
}
