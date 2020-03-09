import { Context } from 'aws-lambda'

/**
 * `before`: an array of hooks to run before the provided lambda
 *
 * `after` an array of hooks to run after the provided lambda
 *
 * `onError` an array of hooks to run only if there's an error during the execution
 */
export interface HooksObject {
    before: HookHandler[]
    after: HookHandler[]
    onError: HookHandler[]
}

export type PartialHooksObject = Partial<HooksObject>

/**
 * @param config optional configuration object for this hook
 * @returns HookHandler
 */
export type HookCreator<Config = {}> = (config?: Config) => HookHandler

export type Response = any
export type Event = any

export interface UseHooksState {
    event: Event
    context: Context
    exit: boolean
    response?: Response
    error?: Error
}

/**
 * @param state a state object that might be manipulated by this function
 * @param state.event event passed in from AWS
 * @param state.context context passed in from AWS
 * @param state.exit defaults to false, if set to true program will exit early after ivocation of this hook
 * @param state.response returned when state.exit is set to true
 * @param state.error exists only if there's an unhandled exception thrown inside a hook or the lambda
 * @returns Promise<state>
 */
export type HookHandler = (state: UseHooksState) => Promise<UseHooksState>

export type UseHooks = (...hooks: PartialHooksObject[]) => WithHooks
export type WithHooks = (lambda: any) => (event: any, context: Context) => Promise<any>
