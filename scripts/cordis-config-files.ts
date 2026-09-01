/** Cordis Loader configuration file discovery. */

import { execFileSync } from 'node:child_process'
import { globSync, lstatSync, readlinkSync } from 'node:fs'
import { isAbsolute, posix, resolve } from 'node:path'

/**
 * Return repository-relative Cordis Loader YAML paths under `root`.
 *
 * Translation consistency records are YAML sidecars, never Loader inputs.
 *
 * @param root Repository root to scan.
 * @returns Sorted repository-relative Loader configuration paths.
 */
export function cordisConfigFiles(root: string): string[] {
  const candidates = globSync(['**/*cordis*.yml', '**/*cordis*.yaml'], {
    cwd: root,
    exclude: ['.claude/**', 'node_modules/**', 'vendor/**', '**/*.i18n.yaml'],
  }).sort()
  const candidateSet = new Set(candidates.map(path => path.replaceAll('\\', '/')))
  const indexedLinks = indexedSymlinkTargets(root)
  return candidates.filter((path) => {
    const normalized = path.replaceAll('\\', '/')
    const indexedTarget = indexedLinks.get(normalized)
    if (indexedTarget !== undefined) {
      requireCanonicalTarget(normalized, indexedTarget, candidateSet, indexedLinks)
      return false
    }
    const absolute = resolve(root, path)
    if (!lstatSync(absolute).isSymbolicLink()) return true
    requireCanonicalTarget(normalized, readlinkSync(absolute), candidateSet, indexedLinks)
    return false
  })
}

/** Git-index links and their repository-relative target text. */
function indexedSymlinkTargets(root: string): Map<string, string> {
  try {
    const rows = execFileSync('git', ['ls-files', '-s', '-z'], {
      cwd: root, stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString('utf8').split('\0')
    return new Map(rows.flatMap((row): Array<[string, string]> => {
      const match = /^120000 [0-9a-f]+ \d+\t(.+)$/.exec(row)
      if (match?.[1] === undefined) return []
      const path = match[1].replaceAll('\\', '/')
      const target = execFileSync('git', ['show', ':' + path], {
        cwd: root, stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8',
      })
      return [[path, target]]
    }))
  } catch {
    return new Map()
  }
}

/** Require a link target to be a non-link Loader config in the discovery set. */
function requireCanonicalTarget(
  alias: string,
  linkText: string,
  candidates: ReadonlySet<string>,
  indexedLinks: ReadonlyMap<string, string>,
): void {
  if (linkText.length === 0 || linkText.includes('\0') || linkText.includes('\n') || isAbsolute(linkText)) {
    throw new Error(alias + ': linked Loader config has an invalid target')
  }
  const target = posix.normalize(posix.join(posix.dirname(alias), linkText.replaceAll('\\', '/')))
  if (target === '..' || target.startsWith('../') || !candidates.has(target) || indexedLinks.has(target)) {
    throw new Error(alias + ': linked Loader config target ' + target + ' must be independently discoverable')
  }
}
