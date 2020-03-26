import { Hook } from '../index'

export const logEvent: Hook = async state => {
    const log = state.config.logger || console.log

    log(`received event: ${JSON.stringify(state.event, null, 4)}`)

    return state
}
