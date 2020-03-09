import { HookCreator } from '../types/hooks'

export const logEvent: HookCreator = () => async state => {
    console.log(`received event: ${state.event}`)

    return state
}
