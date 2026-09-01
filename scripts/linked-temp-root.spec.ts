/** Tests for safe cleanup of temporary directory-link fixtures. */

import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { removeLinkedTempRoot } from './linked-temp-root.ts'

describe('removeLinkedTempRoot', () => {
  it('unlinks external directory links before removing the temporary root', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-linked-temp-root-'))
    const target = mkdtempSync(join(tmpdir(), 'dsh-linked-temp-target-'))
    const keep = join(target, 'keep')
    const link = join(root, 'linked')
    writeFileSync(keep, 'outside\n')
    symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir')

    try {
      removeLinkedTempRoot(root, [link])
      expect(existsSync(root)).toBe(false)
      expect(existsSync(keep)).toBe(true)
    } finally {
      rmSync(target, { recursive: true, force: true })
    }
  })

  it('preserves the temporary root when a tracked path is a real directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-linked-temp-replaced-'))
    const replaced = join(root, 'replaced')
    mkdirSync(replaced)

    try {
      expect(() => {
        removeLinkedTempRoot(root, [replaced])
      }).toThrow('non-link path')
      expect(existsSync(root)).toBe(true)
      expect(existsSync(replaced)).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('refuses a link-shaped temporary root', () => {
    const target = mkdtempSync(join(tmpdir(), 'dsh-linked-temp-root-target-'))
    const holder = mkdtempSync(join(tmpdir(), 'dsh-linked-temp-root-holder-'))
    const root = join(holder, 'root')
    symlinkSync(target, root, process.platform === 'win32' ? 'junction' : 'dir')

    try {
      expect(() => {
        removeLinkedTempRoot(root, [])
      }).toThrow('link-shaped or non-directory')
      expect(existsSync(target)).toBe(true)
    } finally {
      unlinkSync(root)
      rmSync(holder, { recursive: true, force: true })
      rmSync(target, { recursive: true, force: true })
    }
  })

  it('refuses to unlink a tracked path outside the temporary root', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-linked-temp-inside-'))
    const holder = mkdtempSync(join(tmpdir(), 'dsh-linked-temp-outside-'))
    const target = mkdtempSync(join(tmpdir(), 'dsh-linked-temp-outside-target-'))
    const outsideLink = join(holder, 'linked')
    symlinkSync(target, outsideLink, process.platform === 'win32' ? 'junction' : 'dir')

    try {
      expect(() => {
        removeLinkedTempRoot(root, [outsideLink])
      }).toThrow('outside temporary root')
      expect(existsSync(root)).toBe(true)
      expect(existsSync(outsideLink)).toBe(true)
    } finally {
      unlinkSync(outsideLink)
      rmSync(root, { recursive: true, force: true })
      rmSync(holder, { recursive: true, force: true })
      rmSync(target, { recursive: true, force: true })
    }
  })
})
