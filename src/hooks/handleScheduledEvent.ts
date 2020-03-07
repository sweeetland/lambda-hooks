import { HookCreator } from '../index'
import { OK } from '../utils/response'

export const handleScheduledEvent: HookCreator = () => async state => {
    const { event } = state

    if (event['detail-type'] === 'Scheduled Event') {
        state.exit = true
        state.response = OK()
    }

    return state
}
