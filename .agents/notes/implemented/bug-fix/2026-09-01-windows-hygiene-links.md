# Agent Note: Keep Windows hygiene checks independent of symlink privilege

Status: implemented

English | [中文](2026-09-01-windows-hygiene-links.zh.md)

## Problem

Two hygiene checks required Windows file-symbolic-link privilege even though their subjects did not. The NodeNext consumer check linked workspace package directories and Node declarations with file-system symlinks. Cordis config discovery parsed a Git mode 120000 link checkout as YAML when Git materialized the link target as a plain text stub. A normal non-elevated checkout therefore failed before either check evaluated its intended package declarations or canonical Loader files.

## Decision

The NodeNext consumer fixture uses directory junctions on Windows and directory symlinks elsewhere. Both resolve the real package directories while preserving the temporary external-consumer layout. Cleanup records and unlinks each directory link before recursively removing only the real temporary root; a tracked path that is not a link stops cleanup and preserves the root for safe inspection.

Cordis config discovery excludes paths that are file-system symlinks or Git index mode 120000 entries. The canonical target remains independently discoverable and scanned at its own repository path; only the alias is omitted.

## Alternatives considered

**Require Windows Developer Mode or administrator elevation.** Hygiene checks must run in ordinary development and CI shells. Their subjects do not require privileged link creation.

**Skip the checks on Windows.** That would remove declaration compatibility and Loader metadata coverage on a supported platform.

**Parse plain text link stubs as paths and follow them.** This duplicates the canonical target, couples config discovery to checkout representation, and could admit paths outside the intended glob scope.

## Consequences

Windows runs the same NodeNext and Cordis config assertions without elevation. Junctions remain confined to the temporary NodeNext fixture and cannot carry recursive cleanup into their repository targets. Config discovery still scans every canonical in-scope Loader YAML file once.
