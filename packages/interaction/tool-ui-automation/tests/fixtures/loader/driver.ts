#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'
import { boot, resolveConfigPath } from '@deepseek-ai/dsh-app-boot'
import { ToolCallId } from '@deepseek-ai/dsh-llm'

const configPath = process.argv[2]
if (configPath === undefined) throw new Error('UI automation loader fixture needs a config path')
const ctx = await boot('ui-automation-loader-smoke', resolveConfigPath(configPath, undefined))
try {
  const snapshot = await ctx.tools.execute({
    signal: new AbortController().signal,
    callId: ToolCallId('ui-loader-snapshot'),
    name: 'ui.snapshot.v1',
    arguments: { requestId: 'snapshot-1' },
    agent: { id: 'loader.agent' } as never,
  })
  await writeFile('./ui-tools.json', JSON.stringify({
    names: ctx.tools.schemas().map(tool => tool.name).sort(),
    result: snapshot.content,
  }))
} finally {
  await ctx.fiber.dispose()
}
