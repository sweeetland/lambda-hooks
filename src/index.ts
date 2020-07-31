export { handleScheduledEvent, handleUnexpectedError, logEvent, parseEvent } from './hooks'

export interface Hooks {
    before?: Hook[]
    after?: Hook[]
    onError?: Hook[]
}

export type Config = { [k: string]: any }

export type Response = any
export type AWSEvent = any
export type AWSContext = any

export interface State {
    event: AWSEvent
    context: AWSContext
    exit: boolean
    response?: Response
    error?: any
    config: any
}

/**
 * @param state a state object that might be manipulated by this function
 * @param state.event event passed in from AWS
 * @param state.context context passed in from AWS
 * @param state.exit defaults to false, if set to true program will exit early after ivocation of this hook
 * @param state.response returned when state.exit is set to true
 * @param state.error exists only if there's an unhandled exception thrown inside a hook or the lambda handler
 * @returns Promise<state>
 */
export type Hook = (state: State) => Promise<State>

export type UseHooks = (hooks: Hooks, config?: Config) => WithHooks
export type WithHooks = (handler: any) => (event: any, context: AWSContext) => Promise<any>
/**
 * Using the provided hooks create an withHooks higher order function
 * @param hooks a config object of the hooks to apply to your lambda
 * @param hooks.before an array of hooks to run before the provided lambda
 * @param hooks.after an array of hooks to run after the provided lambda
 * @param hooks.onError an array of hooks to run only if there's an error during the execution
 * @returns WithHooks() function that wraps around your lambda
 */
export const useHooks: UseHooks = (hooks: Hooks, config: Config = {}): WithHooks => {
    if (!hooks.before) hooks.before = []
    if (!hooks.after) hooks.after = []
    if (!hooks.onError) hooks.onError = []

    /**
     * Higher order function that takes a lambda function
     * as input and applies the hooks provided to useHooks()
     * @param handler lambda function
     * @returns supercharged lambda  🚀
     */
    const withHooks = (handler: any) => async (event: AWSEvent, context: AWSContext) => {
        let state: State = { event, context, exit: false, config }

        try {
            for (const hook of hooks.before!) {
                state = await hook(state)

                if (state.exit) return state.response
            }

            state.response = await handler(state.event, state.context)
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
