import { HookCreator } from '../index'

interface HookOptions {
    logger: any
}

export const logEvent: HookCreator = ({ logger }: HookOptions) => async state => {
    const log = logger || console.log

    log(`received event: ${JSON.stringify(state.event, null, 4)}`)

    return state
}
