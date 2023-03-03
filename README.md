# EdgeBit Build Action

This action uploads software bill-of-materials (SBOM) and build metadata to [EdgeBit](https://edgebit.io) for vulnerability analysis and dependency inventory. Read [Configuring a Build Pipeline](https://edgebit.io/docs/0.x/install-build/) for more configuration details.

EdgeBit secures your software supply chain by focusing on code that is actually running. This simplifies vulnerability management as it cuts through noise, like inbox zero for CVEs.

Less noise equals less frustration between security and engineering teams. And faster software patching, of course. Sign up at https://signup.edgebit.io.

## Inputs

| Input Name | Description | Value |
|------------|-------------|-------|
| `organization` | EdgeBit organization name, eg `foo` from https://foo.edgebit.io | Required |
| `token` | EdgeBit access token | Required |
| `labels` | Key/value labels to apply to the metadata for organizational purposes | Optional, `"foo=bar, fizz=buzz"` |
| `repo-token` | GitHub API token used to post comments on pull requests | Required, `${{ secrets.GITHUB_TOKEN }}` |

## Example Usage with Container

To trigger this job after your container is built, replace `Build Container` with the job name.

```yaml
name: EdgeBit

on:
  push:
    branches:
      - '*'
  pull_request:
    types: [opened, reopened]
  workflow_run:
    workflows: ["Build Container"]
    types:
      - completed

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  upload-sbom:

    runs-on: ubuntu-latest

    # to prevent duplication on a push & PR in quick succession: 
    # 1. if the push is the first commit on a branch
    #  - skip the push event
    #  - wait for the PR event to trigger the run
    #  - grab the SHA of the PR's target base (e.g. last commit on main) for SBOM comparison
    #    the PR target is only accessible on the PR event, hence this complication
    #    one side effect is that a delay in opening a PR doesn't impact bot behavior
    # 2. if the push is a subsequent commit, use the previous commit SHA for SBOM comparison
    if: (github.event_name == 'push' && github.event.before != '0000000000000000000000000000000000000000') || github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v3

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          # generate for the container built above
          image: registry.example.com/example/image_name:tag
          artifact-name: sbom.spdx

      - name: Upload SBOM to EdgeBit
        uses: edgebitio/edgebit-build@main
        with:
          organization: foo
          token: ${{ secrets.EDGEBIT_TOKEN }}
          labels: 'foo=bar, fizz=buzz'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```

## Example Usage with Local Code

```yaml
name: EdgeBit

on:
  push:
    branches:
      - '*'
  pull_request:
    types: [opened, reopened]

permissions:
  id-token: write
  contents: read
  pull-requests: write

jobs:
  upload-sbom:

    runs-on: ubuntu-latest

    # to prevent duplication on a push & PR event: 
    if: (github.event_name == 'push' && github.event.before != '0000000000000000000000000000000000000000') || github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v3

      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          # generate for the current directory
          path: .
          artifact-name: sbom.spdx

      - name: Upload SBOM to EdgeBit
        uses: edgebitio/edgebit-build@main
        with:
          organization: foo
          token: ${{ secrets.EDGEBIT_ACCESS_TOKEN }}
          labels: 'foo=bar, fizz=buzz'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
```
