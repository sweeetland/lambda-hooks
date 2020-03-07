import { HookCreator } from '../index'
import { SERVER_ERROR } from '../utils/response'

export const handleUnexpectedError: HookCreator = () => async state => {
    const { error } = state

    state.exit = true
    state.response = SERVER_ERROR(error?.message ?? error)

    return state
}
