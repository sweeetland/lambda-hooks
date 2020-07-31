import { Hook } from '../index'

export const handleUnexpectedError: Hook = async state => {
    const { error } = state

    state.exit = true

    state.response = {
        statusCode: error?.statusCode ?? 500,
        body: JSON.stringify({ error: error?.message ?? error }),
    }

    return state
}
