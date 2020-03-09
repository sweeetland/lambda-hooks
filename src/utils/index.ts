import { HooksObject, PartialHooksObject } from '../types/hooks'
import { defaultHook } from './defaultHook'

/**
 * Combine a number of hooksObjects into a single hooksObject
 * @param hooks The hooks to be combined
 */
export const combineHooks = (hooks: PartialHooksObject[]): HooksObject => {
    return hooks.reduce<HooksObject>((result, hook) => {
        // Add any missing properties
        const newHook: HooksObject = { ...defaultHook, ...hook }

        // Combine the result and the current hooksObject
        return {
            before: [...result.before, ...newHook.before],
            after: [...result.after, ...newHook.after],
            onError: [...result.onError, ...newHook.onError],
        }
    }, defaultHook)
}
