import { Hook } from '../index'

export const handleScheduledEvent: Hook = async state => {
    const { event } = state

    if (event['detail-type'] === 'Scheduled Event') {
        state.exit = true
        state.response = { statusCode: 200 }
    }

    return state
}
