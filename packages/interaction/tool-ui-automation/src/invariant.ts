/** Package-owned invariant companion. @module @deepseek-ai/dsh-tool-ui-automation/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'tool-ui-automation-invariant'
export const inject = ['invariants']
/** No runtime invariant: the Consumer owns no state outside provider calls and tool execution. */
const install: InvariantInstaller = () => {}
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-tool-ui-automation', install))
