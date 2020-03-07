import { Context } from 'aws-lambda'

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

export type HookCreator<Config = {}> = (config: Config) => HookHandler
type HookHandler = (state: State) => Promise<State>

type UseHooks = (hooks: Hooks) => ApplyHooks
type ApplyHooks = (lambda: any) => (event: any, context: Context) => Promise<any>

export const useHooks: UseHooks = (hooks: Hooks): ApplyHooks => {
    if (!hooks.before) hooks.before = []
    if (!hooks.after) hooks.after = []
    if (!hooks.onError) hooks.onError = []

    return (lambda: any) => async (event: Event, context: Context) => {
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

            for (const hook of hooks.after!) {
                state = await hook(state)

                if (state.exit) return state.response
            }
        }

        return state.response
    }
}

export default useHooks
