/** Package-owned invariant companion. @module @deepseek-ai/dsh-ui-automation/invariant */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

export const name = 'ui-automation-invariant'
export const inject = ['invariants']
/** No runtime invariant: provider calls return directly and publish no independent event stream. */
const install: InvariantInstaller = () => {}
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register('@deepseek-ai/dsh-ui-automation', install))
