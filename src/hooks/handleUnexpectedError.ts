import { HookCreator } from '../types/hooks'

export const handleUnexpectedError: HookCreator = () => async state => {
    const { error } = state

    state.exit = true
    state.response = { statusCode: 500, body: JSON.stringify({ error: error?.message ?? error }) }

    return state
}
