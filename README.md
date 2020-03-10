# lambda-hooks ⚓️

**Super lightweight module to _hook_ into the execution of your Node.js lambda functions**

Lambda Hooks help avoid repeated logic in your lambda functions. Use some of the provided hooks or easily create your own. They are just functions that can be executed before, after or when an error occurs.

## Principles

-   Zero dependancies 🚫
-   Fast & simple to use 🛤
-   First class support for TypeScript & ES7+ JavaScript 🤓

## Example

```javascript
const useHooks, {logEvent, parseEvent, handleUnexpectedError} = require('lambda-hooks')

// call useHooks with hooks to decorate your lambda with
const withHooks = useHooks({
	before: [logEvent(), parseEvent()],
	after: [],
	onError: [handleUnexpectedError()]
})

const handler = async (event, context) => {
	// your lambda function...
}

// call withHooks passing in your lambda function
exports.handler = withHooks(handler)
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

1. Require the package

```javascript
const { useHooks } = require('lambda-hooks')
```

2. Call useHooks with the hooks that you want to use. There's 3 types of hooks that are executed either before the lambda execution, after or if an error occurs.

    Note that the order of the hooks matters, they are executed one by one starting from the first hook in the before array, then your lambda function is invoked, then through all hooks in the after array. If at any point an error occurs, execution is directed towards the onError hooks array.

    Also, notice that we are invoking the hooks when they are passed in, this is deliberate and will make more sense when we get to a more complex example later.

```javascript
const withHooks = useHooks({
    before: [logEvent(), parseEvent()],
    after: [],
    onError: [handleUnexpectedError()],
})
```

3. useHooks returns a function withHooks. Pass your **async** lambda into the withHooks function to decorate your lambda and then export as normal.

```javascript
const  handler = async (event, context) => {...}

exports.handler = withHooks(handler)
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
const withHooks = useHooks({
    before: [logEvent(), parseEvent(), validateEventBody({ schema })],
})
```

As you can see, when creating hooks like this, the possibilities are endless. You just have to use your imagination... 🧠

Woah calm down, actually there are a few rules ☝️

### Rules of Hooks

1. A hook must be a higher order function
2. The returned function (HookHandler) must be async or return a promise
3. The HookHandler accepts the state object as input and must return the state object
4. Your lambda function must be async

## Recommendations

> _"with great power, comes great responsibility"_ - someone, somewhere

Here's a few recommendations that might make your life easier.

-   **Export the withHooks function to share across related lambdas.** For example, all your API lambdas might utilise the same hooks, but, your DynamoDB stream lambdas might need to utilise a different set of hooks. Rather than repeating the useHooks call for each lambda, call once and share around the related lambdas...

```javascript
// file: src/hooks/api.js
export const withApiHooks = (lambda, { requestSchema } = {}) =>
    useHooks({
        before: [
            handleScheduledEvent(),
            logEvent(),
            parseEvent(),
            validateEventBody({ requestSchema }),
        ],
        onError: [handleUnexpectedError()],
    })(lambda))


// file: src/api/lambda.js
const { withApiHooks } = require('../hooks/api')

...

const handler = async event => {...}

export const lambda = withApiHooks(handler, { requestSchema: schema })
```

-   **Write your own hooks.** It's really easy to do. And, if you're migrating an existing project over, the logic will barely change. Just remember that to create a hook, you need a function (HookCreator) that returns another function (HookHandler). The HookCreator takes an optional config object. The HookHandler takes the state as input and also returns the state. That is all you need to know!

        	Feel free to share any hooks you make by submitting a PR 😉and, here's a boilerplate hook (that does absolutely nothing) to get you started:

```javascript
export const myNewHook = () => async state => {
    const { event, context } = state

    // your custom hook logic here....

    return state
}
```

-   **Use TypeScript.** I bet some of you JS folk are sick of hearing about it. But, once you get over the hump, it makes coding a lot more enjoyable, honestly. Speaking of which...

## TypeScript 🙌

```typescript
import { useHooks,
    handleScheduledEvent,
    handleUnexpectedError,
    logEvent,
    parseEvent,
    validateEventBody,
} from 'lambda-hooks'

const handler = async (event: APIGatewayProxyEvent, context: Context) => {...}

export const lambda = useHooks({
        before: [
            handleScheduledEvent(),
            logEvent(),
            parseEvent(),
        ],
        onError: [handleUnexpectedError()],
    })(handler)
```

Here's some types for more clarity on the explanations above. Note, you don't need to copy & paste these, this is just for comprehension, any types you need can be imported from the package.

```typescript
interface Hooks {
    before?: HookHandler[]
    after?: HookHandler[]
    onError?: HookHandler[]
}

type UseHooks = (hooks: Hooks) => WithHooks

type WithHooks = (lambda: any) => (event: any, context: Context) => Promise<any>

type HookCreator<Config = {}> = (config?: Config) => HookHandler

type HookHandler = (state: State) => Promise<State>
```

Now let's get to an example of a hook written in TypeScript. Often when building with lambdas you'll want to keep some of your lambdas warm to avoid cold starts, but if you're doing this, remember to check and quit immediately otherwise you're wasting 💰. That's what this hook does...

```typescript
import { HookCreator } from 'lambda-hooks'

export const handleScheduledEvent: HookCreator = () => async state => {
    const { event } = state

    if (event['detail-type'] === 'Scheduled Event') {
        state.exit = true
        state.response = { statusCode: 200 }
    }

    return state
}
```
