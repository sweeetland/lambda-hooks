import { Context } from 'aws-lambda';

export {
    handleScheduledEvent,
    handleUnexpectedError,
    logEvent,
    parseEvent,
    validateEventBody,
} from './hooks'

interface Hooks {
    before?: HookHandler[]
    after?: HookHandler[]
    onError?: HookHandler[]
}

type Response = any
type Event = any

interface State {
    event: Event
    context: Context
    exit: boolean
    response?: Response
    error?: Error
}

/**
 * @param config optional configuration object for this hook
 * @returns HookHandler
 */
export type HookCreator<Config = {}> = (config?: Config) => HookHandler
/**
 * @param state a state object that might be manipulated by this function
 * @param state.event event passed in from AWS
 * @param state.context context passed in from AWS
 * @param state.exit defaults to false, if set to true program will exit early after ivocation of this hook
 * @param state.response returned when state.exit is set to true
 * @param state.error exists only if there's an unhandled exception thrown inside a hook or the lambda
 * @returns Promise<state>
 */
type HookHandler = (state: State) => Promise<State>

type UseHooks = (hooks: Hooks) => ApplyHooks
type ApplyHooks = (lambda: any) => (event: any, context: Context) => Promise<any>
/**
 * Using the provided hooks create an applyHooks higher order function
 * @param hooks a config object of the hooks to apply to your lambda
 * @param hooks.before an array of hooks to run before the provided lambda
 * @param hooks.after an array of hooks to run after the provided lambda
 * @param hooks.onError an array of hooks to run only if there's an error during the execution
 * @returns ApplyHooks() function that wraps around your lambda
 */
export const useHooks: UseHooks = (hooks: Hooks): ApplyHooks => {
    if (!hooks.before) hooks.before = []
    if (!hooks.after) hooks.after = []
    if (!hooks.onError) hooks.onError = []

    /**
     * Higher order function that takes a lambda function
     * as input and applies the hooks provided to useHooks()
     * @param lambda lambda function
     * @returns supercharged lambda  🚀
     */
    const applyHooks = (lambda: any) => async (event: Event, context: Context) => {
        let state: State = { event, context, exit: false }

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

    return applyHooks
}

export default useHooks
