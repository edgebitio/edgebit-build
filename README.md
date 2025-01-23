# EdgeBit Build Action

This action uploads software bill-of-materials (SBOM) and build metadata to [EdgeBit](https://edgebit.io) for vulnerability analysis and dependency inventory. Read [Configuring a Build Pipeline](https://edgebit.io/docs/0.x/install-build-actions/) for more configuration details.

EdgeBit secures your software supply chain by focusing on code that is actually running. This simplifies vulnerability management as it cuts through noise, like inbox zero for CVEs.

Less noise equals less frustration between security and engineering teams. And faster software patching, of course. Sign up at https://signup.edgebit.io.

## Inputs

| Input Name | Description | Value |
|------------|-------------|-------|
| `edgebit-url` | EdgeBit organization url | Required<br/>`https://foo.edgebit.io` |
| `token` | EdgeBit access token | Required<br/>`${{ secrets.EDGEBIT_TOKEN }}`|
| `sbom-file` | Location of the SBOM on disk | Required<br/>`/tmp/sbom.syft.json` |
| `component` | Name of the component, like a frontend or backend. A new component will be created automatically if it doesn't exist. | Required<br/>`my-frontend` |
| `tags` | Identifiers to organize a single SBOM in a stream of SBOMs. Conceptually similar to container tags. | Optional<br/>`'latest', 'v1.2.3'` |
| `repo-token` | GitHub API token used to post comments on PRs | Optional<br/>`${{ secrets.GITHUB_TOKEN }}` |
| `image-tag` | The tag of the container image | Optional<br/>Taken from the build step |
| `image-id` | The ID of the container image | Optional<br/>Taken from the build step |

## Example Usage with Container

Use this pipeline if your deployment artifact is a container.

Locate the workflow that builds the Docker container and add steps to generate and upload the SBOM.

This shows an example workflow file with the added steps.

This action assumes that the default branch is named main. When the code is merged into main, it will add a latest tag for the corresponding SBOM.

```yaml
name: Build

on:
  push:
    branches:
      - '*'
  pull_request:
    types: [opened, reopened, synchronize]

env:
  CONTAINER_IMAGE: registry.example.com/foo:latest

jobs:
  build-container:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Build and push
        id: build
        uses: docker/build-push-action@v4
        with:
          # Ensure load or push is set to true
          load: true
          tags: ${{ env.CONTAINER_IMAGE }}

      #
      # Add these steps following the build
      # Assumes that the build step id is "build"
      #
      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          # generate for the container built above
          image: ${{ steps.build.outputs.imageid }}
          output-file: /tmp/sbom.syft.json
          upload-artifact: false
          format: syft-json

      - name: Upload SBOM to EdgeBit
        uses: edgebitio/edgebit-build@v1
        with:
          edgebit-url: https://foo.edgebit.io
          image-id: ${{ steps.build.outputs.imageid }}
          image-tag: ${{ env.CONTAINER_IMAGE }}
          token: ${{ secrets.EDGEBIT_TOKEN }}
          tags: ${{ github.ref == 'refs/heads/main' && 'latest' || '' }}
          component: my-frontend
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          sbom-file: /tmp/sbom.syft.json
```

## Example Usage with Source Code

Use this pipeline if the container action isn’t able to find the dependencies of your container image.

This action assumes that the default branch is named `main`. When the code is merged into main, it will add a `latest` tag for the corresponding SBOM.

```yaml
name: EdgeBit

on:
  push:
    branches:
      - 'main'
  pull_request:
    types: [opened, reopened, synchronize]

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
          output-file: /tmp/sbom.syft.json
          upload-artifact: false
          format: syft-json

      - name: Upload SBOM to EdgeBit
        uses: edgebitio/edgebit-build@main
        with:
          edgebit-url: https://foo.edgebit.io
          token: ${{ secrets.EDGEBIT_TOKEN }}
          tags: ${{ github.ref == 'refs/heads/main' && 'latest' || '' }}
          component: foo
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          sbom-file: /tmp/sbom.syft.json
```

## Building a Release

After making changes, run `npm run build && npm run package` in your pull request.
