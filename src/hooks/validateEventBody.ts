import { ObjectSchema } from 'yup'

import { HookCreator } from '../types/hooks'

interface Config {
    requestSchema: ObjectSchema
}

export const validateEventBody: HookCreator<Config> = config => async state => {
    if (!config) throw Error('missing required config for validation')

    try {
        const { event } = state

        await config.requestSchema.validate(event.body, { strict: true })

        console.log(`yup body passed validation: ${event.body}`)
    } catch (error) {
        console.log(`yup error validating body: ${error}`)

        state.exit = true
        state.response = { statusCode: 400, body: JSON.stringify({ error: error.message }) }
    }

    return state
}
