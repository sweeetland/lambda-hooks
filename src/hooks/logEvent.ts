import { HookCreator } from '../index'

export const logEvent: HookCreator = () => async state => {
    console.log(`received event: ${state.event}`)

    return state
}
