import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const expectedPnpmVersion = '11.4.0'
const dockerfiles = ['Dockerfile', 'deploy/Dockerfile']
const requiredBuildApprovals = ['esbuild', 'vue-demi']
const errors = []

function readRepoFile(path) {
  return readFileSync(resolve(repoRoot, path), 'utf8')
}

function assert(condition, message) {
  if (!condition) {
    errors.push(message)
  }
}

for (const dockerfilePath of dockerfiles) {
  const dockerfile = readRepoFile(dockerfilePath)
  const workspaceCopy = 'COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./'
  const install = 'RUN pnpm install --frozen-lockfile'

  assert(!dockerfile.includes('pnpm@latest'), `${dockerfilePath} must not install pnpm@latest`)
  assert(
    dockerfile.includes(`ARG PNPM_VERSION=${expectedPnpmVersion}`),
    `${dockerfilePath} must pin PNPM_VERSION=${expectedPnpmVersion}`,
  )
  assert(
    dockerfile.includes('corepack prepare pnpm@${PNPM_VERSION} --activate'),
    `${dockerfilePath} must activate the pinned PNPM_VERSION`,
  )
  assert(
    dockerfile.includes(workspaceCopy),
    `${dockerfilePath} must copy frontend/pnpm-workspace.yaml before installing dependencies`,
  )
  assert(
    dockerfile.indexOf(workspaceCopy) !== -1 && dockerfile.indexOf(workspaceCopy) < dockerfile.indexOf(install),
    `${dockerfilePath} must copy pnpm workspace config before pnpm install`,
  )
}

const frontendPackage = JSON.parse(readRepoFile('frontend/package.json'))
assert(
  frontendPackage.packageManager === `pnpm@${expectedPnpmVersion}`,
  `frontend/package.json must declare packageManager pnpm@${expectedPnpmVersion}`,
)

let workspaceConfig = ''
try {
  workspaceConfig = readRepoFile('frontend/pnpm-workspace.yaml')
} catch {
  errors.push('frontend/pnpm-workspace.yaml must exist')
}

if (workspaceConfig) {
  assert(workspaceConfig.includes("  - '.'"), 'frontend/pnpm-workspace.yaml must include the frontend package')
  assert(workspaceConfig.includes('allowBuilds:'), 'frontend/pnpm-workspace.yaml must define allowBuilds')

  for (const packageName of requiredBuildApprovals) {
    assert(
      workspaceConfig.includes(`  ${packageName}: true`),
      `frontend/pnpm-workspace.yaml must approve ${packageName} build scripts`,
    )
  }
}

if (errors.length > 0) {
  throw new Error(`Docker pnpm config check failed:\n- ${errors.join('\n- ')}`)
}
