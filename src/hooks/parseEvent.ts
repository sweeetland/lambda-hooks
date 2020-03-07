import { HookCreator } from '../index'

export const parseEvent: HookCreator = () => async state => {
    const { event } = state
    const { body, pathParameters, queryStringParameters, multiValueQueryStringParameters } = event

    if (typeof body === 'string') {
        event.body = JSON.parse(body)
    }

    if (!pathParameters) {
        event.pathParameters = {}
    }

    if (!queryStringParameters) {
        event.queryStringParameters = {}
    }

    if (!multiValueQueryStringParameters) {
        event.multiValueQueryStringParameters = {}
    }

    return state
}
