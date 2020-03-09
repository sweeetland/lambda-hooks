import { Context } from 'aws-lambda'

import { Event, HooksObject, UseHooks, UseHooksState } from './types/hooks'
import { combineHooks } from './utils'
import { defaultHook } from './utils/defaultHook'

export {
    handleScheduledEvent,
    handleUnexpectedError,
    logEvent,
    parseEvent,
    validateEventBody,
} from './hooks'

export * from './types/hooks'

/**
 * Using the provided hooks create an `withHooks` higher order function
 * @param hooks a variadic array of config objects containing the hooks to apply to your lambda. Each config object can contain `before`, `after` and `onError` arrays
 * @returns WithHooks() function that wraps around your lambda
 */
export const useHooks: UseHooks = (...hooksArr) => {
    if (!hooksArr) {
        hooksArr = [defaultHook]
    }

    const hooks: HooksObject = combineHooks(hooksArr)

    /**
     * Higher order function that takes a lambda function
     * as input and applies the hooks provided to useHooks()
     * @param lambda lambda function
     * @returns supercharged lambda 🚀
     */
    const withHooks = (lambda: any) => async (event: Event, context: Context) => {
        let state: UseHooksState = { event, context, exit: false }

        try {
            for (const hook of hooks.before!) {
                state = await hook(state)

                if (state.exit) return state.response
            }

            state.response = await lambda(state.event, state.context)
            if (hooks?.after?.length === 0) return state.response

            for (const hook of hooks.after!) {
                state = await hook(state)

                if (state.exit) return state.response
            }
        } catch (error) {
            state.error = error

            for (const hook of hooks.onError!) {
                state = await hook(state)

                if (state.exit) return state.response
            }
        }

        return state.response
    }

    return withHooks
}

export default useHooks
