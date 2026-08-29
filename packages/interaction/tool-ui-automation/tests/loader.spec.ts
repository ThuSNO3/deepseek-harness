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
    'ui.click.v1', 'ui.describe_ref.v1', 'ui.fill.v1', 'ui.press.v1',
    'ui.select_item.v1', 'ui.select_option.v1', 'ui.set_checked.v1', 'ui.set_value.v1',
    'ui.snapshot.v1', 'ui.wait.v1',
  ])
  expect(result).toEqual([{ type: 'text', text: JSON.stringify({
    revision: 1, windowId: 'loader.agent', modalDepth: 0, focusRef: null,
    busy: false, nodes: [], truncated: false,
  }) }])
}, 45_000)
