# EdgeBit Build Action

This action uploads software bill-of-materials (SBOM) and build metadata to [EdgeBit](https://edgebit.io) for vulnerability analysis and dependency inventory. Read [Configuring a Build Pipeline](https://edgebit.io/docs/0.x/install-build/) for more configuration details.

EdgeBit secures your software supply chain by focusing on code that is actually running. This simplifies vulnerability management as it cuts through noise, like inbox zero for CVEs.

Less noise equals less frustration between security and engineering teams. And faster software patching, of course. Sign up at https://signup.edgebit.io.

## Inputs

| Input Name | Description | Value |
|------------|-------------|-------|
| `edgebit-url` | EdgeBit organization url | Required, `https://foo.edgebit.io` |
| `token` | EdgeBit access token | Required |
| `labels` | Key/value labels to apply to the metadata for organizational purposes | Optional, `"foo=bar, fizz=buzz"` |
| `repo-token` | GitHub API token used to post comments on pull requests | Required, `${{ secrets.GITHUB_TOKEN }}` |
| `sbom-file` | Location of the SBOM on disk | Required, `/tmp/sbom.syft.json` |

## Example Usage with Container

This action contains two jobs: the first builds a container and the second builds the SBOM and pushes it to EdgeBit. The second job consumes an output variable of the build container name.

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

env:
  CONTAINER_IMAGE: registry.example.com/foo:latest

jobs:
  build-container:
    runs-on: ubuntu-latest
    outputs:
      container_image: ${{ env.CONTAINER_IMAGE }}

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Build and push
        uses: docker/build-push-action@v4
        
        with:
          context: .
          tags: ${{ env.CONTAINER_IMAGE }}

  upload-sbom:

    runs-on: ubuntu-latest

    # ensure the SBOM is genearted after your container is built
    needs: build-container

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
          image: ${{needs.build-container.outputs.container_image}}
          artifact-name: sbom.syft.json
          output-file: /tmp/sbom.syft.json
          format: syft-json

      - name: Upload SBOM to EdgeBit
        uses: edgebitio/edgebit-build@main
        with:
          edgebit-url: https://foo.edgebit.io
          token: ${{ secrets.EDGEBIT_TOKEN }}
          labels: 'foo=bar, fizz=buzz'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          sbom-file: /tmp/sbom.syft.json
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
          artifact-name: sbom.syft.json
          output-file: /tmp/sbom.syft.json
          format: syft-json

      - name: Upload SBOM to EdgeBit
        uses: edgebitio/edgebit-build@main
        with:
          edgebit-url: https://foo.edgebit.io
          token: ${{ secrets.EDGEBIT_ACCESS_TOKEN }}
          labels: 'foo=bar, fizz=buzz'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          sbom-file: /tmp/sbom.syft.json
```
