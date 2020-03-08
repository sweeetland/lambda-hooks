# lambda-hooks ɧ

**Super lightweight module to _hook_ into the execution of your Node.js lambda functions**

Lambda Hooks help avoid repeated logic in your lambda functions. Use some of the provided hooks or easily create your own. They are just functions that can be executed before, after or when an error occurs.

## Principles

-   Zero dependancies
-   Fast & simple to use
-   First class support for TypeScript & modern JavaScript

## Example

```javascript
const  useHooks, {logEvent, parseEvent, handleUnexpectedError} = require('lambda-hooks')

// call useHooks with hooks to decorate your lambda with
const  applyHooks = useHooks({
	before: [logEvent(), parseEvent()],
	after: [],
	onError: [handleUnexpectedError()]
})

const  handler = async (event, context) => {
	// your lambda function...
}

// call applyHooks passing in your lambda function
exports.handler = applyHooks(handler)
```

## Install

Using npm:

```bash
npm install lambda-hooks
```

or with yarn:

```bash
yarn add lambda-hooks
```

_TypeScript types are included_ 🧰

## Usage

1. Import/require the package

```javascript
const useHooks = require('lambda-hooks')
```

2. Call useHooks with the hooks that you want to use. There's 3 types of hooks that are executed either before the lambda execution, after or if an error occurs.

    Note that the order of the hooks matters, they are executed one by one from the first hook in the before array.

    Also, notice that we are invoking the hooks when they are passed in, this is deliberate and will make more sense when we get to a more complex example later.

```javascript
const applyHooks = useHooks({
    before: [logEvent(), parseEvent()],
    after: [],
    onError: [handleUnexpectedError()],
})
```

3. useHooks returns a function applyHooks. Pass your **async** lambda into the applyHooks function to decorate your lambda and then export as normal.

```javascript
const  handler = async (event, context) => {...}

exports.handler = applyHooks(handler)
```

## What the hook? 👀

I'm glad you asked, let's start with a simple example of a hook that logs the event

```javascript
export const logEvent = () => async state => {
    console.log(`received event: ${state.event}`)

    return state
}
```

Notice that we have a function that returns a function, a higher order function. The parent function is the HookCreator and the returned function is the HookHandler. We'll get to why later.

For now, let's focus on the returned function the HookHandler. This function **receives and returns** a state object that looks like this:

```typescript
interface State {
    event: Event // AWS lambda event
    context: Context // AWS lambda context
    exit: boolean // Set to true to quit execution early
    response?: Response // This will contain the response from your lambda after it has been executed. Also this will be returned when exit is true
    error?: Error // If there's an unhandled exception, it will be attached here & your onError handlers will be invoked
}
```

You can write hooks to manipulate the event before it reaches your lambda function. For example, when writing lambdas that sit behind an API often you need to parse the event body. Let's do exactly that:

```javascript
export const parseEventBody = () => async state => {
    const { event } = state

    if (typeof event.body === 'string') {
        state.event.body = JSON.parse(event.body)
    }

    return state
}
```

Ok you get the gist, now it's time for a more complex example. Again, when creating lambdas that sit behind a rest API, it's a good idea to validate the event body (assuming this hasn't already been done by API gateway). Like so:

```javascript
export const validateEventBody = ({ schema }) => async state => {
    if (!schema) {
        throw Error('missing required schema for validation')
    }

    try {
        const { event } = state

        await schema.validate(event.body, { strict: true })

        console.log(`yup body passed validation: ${event.body}`)
    } catch (error) {
        console.log(`yup error validating body: ${error}`)

        state.exit = true
        state.response = { statusCode: 400, body: JSON.stringify({ error: error.message }) }
    }

    return state
}
```

Here we are utilising a library called yup for validation. Usually validation libraries need a schema to validate against, but how do we have access to the schema from inside the hook at the point of execution?

That's why we have a higher order function, the HookCreator. This is to pass in anything that the hooks need that isn't already on the state object. See in this example we pass in the request schema to the HookCreator. This means that at the point of execution, we now have access to the schema in the HookHandler.

But for this to work though, we need to remember to pass in the schema to the HookCreator when we invoke useHooks. Like so:

```javascript
const applyHooks = useHooks({
    before: [logEvent(), parseEvent(), validateEventBody({ schema })],
})
```

As you can see, when creating hooks like this, the possibilities are endless. You just have to use your imagination... 🧠

Woah calm down, actually there are a few rules ☝️

### Rules of Hooks

1. A hook must be a higher order function
2. The returned function (HookHandler) must be async or return a promise
3. The HookHandler excepts the state object as input and returns the state object
4. Your lambda function must be async
