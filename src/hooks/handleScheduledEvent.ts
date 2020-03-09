import { HookCreator } from '../types/hooks'

export const handleScheduledEvent: HookCreator = () => async state => {
    const { event } = state

    if (event['detail-type'] === 'Scheduled Event') {
        state.exit = true
        state.response = { statusCode: 200 }
    }

    return state
}
