import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { runLoaderSmoke } from '@deepseek-ai/dsh-loader-smoke'

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/loader/${name}`, import.meta.url))

it('registers all UI tools through a real Loader composition', async () => {
  let names: string[] = []
  let result: unknown[] = []
  await runLoaderSmoke({
    label: 'UI automation loader smoke',
    tempDirPrefix: 'ui-automation-loader-',
    binScript: fixture('driver.ts'),
    libBinScript: fixture('driver.ts'),
    configPath: fixture('cordis.yml'),
    tsconfigPath: fileURLToPath(new URL('../../../../tsconfig.json', import.meta.url)),
    inspect: async (cwd) => {
      const report = JSON.parse(await readFile(join(cwd, 'ui-tools.json'), 'utf8')) as { names: string[]; result: unknown[] }
      names = report.names
      result = report.result
    },
  })
  expect(names).toEqual([
    'ui.activate_tab.v2', 'ui.click.v2', 'ui.describe_ref.v2', 'ui.fill.v2',
    'ui.press.v2', 'ui.select_item.v2', 'ui.select_option.v2', 'ui.set_checked.v3',
    'ui.set_value.v2', 'ui.snapshot.v2', 'ui.wait.v2',
  ])
  expect(result).toEqual([{ type: 'text', text: JSON.stringify({
    snapshotId: 's-loader', surfaceRevision: 1, windowStack: ['loader.agent'],
    focusRef: null, busy: false, modalDepth: 0, nodes: [], nextCursor: null, complete: true,
  }) }])
}, 45_000)
