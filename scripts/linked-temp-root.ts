/** Safely remove a temporary directory that contains links to external directories. */

import { lstatSync, rmSync, unlinkSync } from 'node:fs'
import { isAbsolute, relative, resolve, sep } from 'node:path'

/**
 * Unlink every tracked directory link before recursively removing its real temporary root.
 *
 * @param root Known real temporary directory created by the caller.
 * @param links Link paths inside `root`, recorded immediately after each successful creation.
 */
export function removeLinkedTempRoot(root: string, links: readonly string[]): void {
  const resolvedRoot = resolve(root)
  const rootStats = lstatSync(resolvedRoot)
  if (!rootStats.isDirectory() || rootStats.isSymbolicLink()) {
    throw new Error(`Refusing to recursively remove link-shaped or non-directory temporary root ${JSON.stringify(root)}.`)
  }
  for (const link of links.toReversed()) {
    const resolvedLink = resolve(link)
    const fromRoot = relative(resolvedRoot, resolvedLink)
    if (fromRoot === '' || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
      throw new Error(`Refusing to unlink path outside temporary root ${JSON.stringify(link)}.`)
    }
    if (!lstatSync(resolvedLink).isSymbolicLink()) {
      throw new Error(`Refusing to recursively remove temporary root with non-link path ${JSON.stringify(link)}.`)
    }
    unlinkSync(resolvedLink)
  }
  rmSync(resolvedRoot, { recursive: true, force: true })
}
