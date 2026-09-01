import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { cordisConfigFiles } from './cordis-config-files.ts'

const roots: string[] = []

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

describe('cordisConfigFiles', () => {
  it('finds Loader YAML without treating translation records as configs', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-cordis-config-files-'))
    roots.push(root)
    for (const directory of ['.claude', 'apps/cli/config/examples', 'docs', 'node_modules/pkg', 'vendor/pkg']) {
      mkdirSync(join(root, directory), { recursive: true })
    }
    for (const file of [
      '.claude/hidden.cordis.yml',
      'docs/cordis-primer.i18n.yaml',
      'apps/cli/config/examples/agent.cordis.yaml',
      'apps/cli/config/examples/headless.cordis.yml',
      'node_modules/pkg/hidden.cordis.yml',
      'vendor/pkg/hidden.cordis.yml',
    ]) {
      writeFileSync(join(root, file), '[]\n')
    }

    expect(cordisConfigFiles(root)).toEqual([
      join('apps', 'cli', 'config', 'examples', 'agent.cordis.yaml'),
      join('apps', 'cli', 'config', 'examples', 'headless.cordis.yml'),
    ])
  })

  it.skipIf(process.platform === 'win32')('does not scan a linked config twice', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-cordis-config-link-'))
    roots.push(root)
    mkdirSync(join(root, 'configs'), { recursive: true })
    writeFileSync(join(root, 'configs/source.cordis.yml'), '[]\n')
    symlinkSync('source.cordis.yml', join(root, 'configs/alias.cordis.yml'))

    expect(cordisConfigFiles(root)).toEqual([join('configs', 'source.cordis.yml')])
  })

  it('rejects an indexed link whose target is not independently discoverable', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-cordis-index-link-'))
    roots.push(root)
    mkdirSync(join(root, 'configs'), { recursive: true })
    writeFileSync(join(root, 'configs/source.yml'), '[]\n')
    writeFileSync(join(root, 'configs/alias.cordis.yml'), 'source.yml')
    execFileSync('git', ['init', '--quiet'], { cwd: root })
    const oid = execFileSync('git', ['hash-object', '-w', '--stdin'], {
      cwd: root, input: 'source.yml', encoding: 'utf8',
    }).trim()
    execFileSync('git', [
      'update-index', '--add', '--cacheinfo', '120000,' + oid + ',configs/alias.cordis.yml',
    ], { cwd: root })

    expect(() => cordisConfigFiles(root)).toThrow(
      'configs/alias.cordis.yml: linked Loader config target configs/source.yml '
      + 'must be independently discoverable',
    )
  })
})
