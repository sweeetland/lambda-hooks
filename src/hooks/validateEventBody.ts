import { ObjectSchema } from 'yup'

import { HookCreator } from '../index'
import { BAD_REQUEST } from '../utils/response'

interface Config {
    requestSchema: ObjectSchema
}

export const validateEventBody: HookCreator<Config> = config => async state => {
    try {
        const { event } = state

        await config.requestSchema.validate(event.body, { strict: true })

        console.log(`yup body passed validation: ${event.body}`)
    } catch (error) {
        console.log(`yup error validating body: ${error}`)

        state.exit = true
        state.response = BAD_REQUEST(error.message)
    }

    return state
}
