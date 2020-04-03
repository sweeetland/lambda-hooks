import { Hook } from '../index'

export const parseEvent: Hook = async state => {
    const { event } = state
    const {
        body,
        pathParameters,
        queryStringParameters,
        multiValueQueryStringParameters,
        headers,
    } = event

    if (typeof body === 'string') {
        event.body = JSON.parse(body)
    }

    if (typeof headers === 'string') {
        event.headers = JSON.parse(headers)
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
