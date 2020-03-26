# lambda-hooks

**Super lightweight module to _hook_ into the execution of your Node.js lambda functions**

Lambda Hooks help avoid repeated logic in your lambda functions. Use some of the provided hooks or easily create your own. They are just functions that can be executed before, after or when an error occurs.

## Principles

-   Zero dependencies
-   Fast & simple to use
-   First class support for TypeScript & ES7+ JavaScript

## Motivation

When working with AWS lambda functions, typically, there's some frequent actions that you need to do on every invocation. Things like logging the event, parsing the event body, schema validation, handling unexpected errors etc. It's easy to end up with a lot of _repeated yet necessary_ code in your lambda functions.

I wanted a **simple**, **easy to use** solution, with **minimal overhead** and good **TypeScript** support. Where I could define these actions once to share across all my related lambdas, keeping my lambdas for business logic only.

I couldn't find a solution that I was happy with, hence the reason for this light package. It is early days yet, but it's being used in production, and I hope others find this helpful too.

Here's a before and after screenshot...

![a before and after screenshot of code without hooks vs withHooks](https://raw.githubusercontent.com/sweeetland/lambda-hooks/master/assets/beforeAndAfter.png)

## Example

```javascript
const { useHooks, logEvent, parseEvent, handleUnexpectedError } = require('lambda-hooks')

// call useHooks with hooks to decorate your lambda with
const withHooks = useHooks({
    before: [logEvent, parseEvent],
    after: [],
    onError: [handleUnexpectedError],
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

_TypeScript types included_ 🧰

## Usage

1 - Require the package

```javascript
const { useHooks } = require('lambda-hooks')
```

2 - Call useHooks with the hooks that you want to use. There's 3 types of hooks that are executed either before the lambda execution, after or if an error occurs.

Note that the order of the hooks matters, they are executed one by one starting from the first hook in the before array, then your lambda function is invoked, then through all hooks in the after array. If at any point an error occurs, execution is directed towards the onError hooks array.

```javascript
const withHooks = useHooks({
    before: [logEvent, parseEvent],
    after: [],
    onError: [handleUnexpectedError],
})
```

3 - useHooks returns a function withHooks. Pass your **async** lambda into the withHooks function to decorate your lambda and then export as normal.

```javascript
const  handler = async (event, context) => {...}

exports.handler = withHooks(handler)
```

### Flow of Execution

This is a visual of the order in which the hooks are executed. One by one from the before array, to the lambda and then to the after array, only reaching the onError array _if_ there's an error.

```javascript
const withHooks = useHooks({
    // start -->
    before: [firstHook, secondHook],

    // lambda function is invoked now...

    after: [thirdHook],
    //        Finish -->|

    onError: [fourthHook],
    // Finish if errors -->|
})
```

## What the hook? 👀

I'm glad you asked, let's start with a simple example of a hook that logs the aws lambda event to the console

```javascript
export const logEvent = async state => {
    console.log(`received event: ${state.event}`)

    return state
}
```

Yes it really is that easy... A Hook is just a function that **receives and returns** the state object that looks like this:

```typescript
interface State {
    event: Event // AWS lambda event
    context: Context // AWS lambda context
    exit: boolean // Set to true to quit execution early
    response?: Response // This will contain the response from your lambda after it has been executed. Also this will be returned when exit is true
    error?: Error // If there's an unhandled exception, it will be attached here & your onError handlers will be invoked
    config: any // Config object to provide extra things to your hooks at the point of execution e.g. you might want to pass a logger into logEvent
}
```

You can write hooks to manipulate the event before it reaches your lambda function. For example, when writing lambdas that sit behind an API often you need to parse the event body. Let's do exactly that:

```javascript
export const parseEventBody = async state => {
    const { event } = state

    if (typeof event.body === 'string') {
        state.event.body = JSON.parse(event.body)
    }

    return state
}
```

Ok you get the gist, now it's time for a more complex example. Again, when creating lambdas that sit behind a rest API, it's a good idea to validate the event body (assuming this hasn't already been done by API gateway). Like so:

```javascript
export const validateEventBody = async state => {
    const { schema } = state.config

    if (!schema) {
        throw Error('missing required schema for validation')
    }

    try {
        const { event } = state

        await schema.validate(event.body, { strict: true })

        console.log(`yup event.body passed validation: ${event.body}`)
    } catch (error) {
        console.log(`yup error validating event.body: ${error}`)

        state.exit = true
        state.response = { statusCode: 400, body: JSON.stringify({ error: error.message }) }
    }

    return state
}
```

Here we are utilising a library called yup for validation. Usually validation libraries need a schema to validate against, but how do we have access to the schema from inside the hook at the point of execution?

Well the useHooks function accepts a optional second argument which is a configuration object. In here you can pass in anything you might need from within your hooks. In this hook, we are expecting a schema to be attached to the config object so we now have access to the schema from inside the Hook, at the point of execution. Another example could be when using the logEvent hook, you might want to pass in a logger rather than using console.log.

But for this to work though, we need to remember to pass in the schema to the useHooks. Like so:

```javascript
const withHooks = useHooks(
    {
        before: [logEvent, parseEvent, validateEventBody],
    },
    { schema }
)
```

As you can see, when creating hooks like this, the possibilities are endless. You just have to use your imagination... 🧠

Woah calm down, actually there are a few rules ☝️

### Rules of Hooks

1. A hook is a function that must recieve and return the state object
2. Call useHooks with the hooks object and a config object provide additional configuration to those hooks
3. Your lambda function must be async

## Recommendations

> _"with great power, comes great responsibility"_ - someone, somewhere

Here's a few recommendations that might make your life easier.

-   **Export the withHooks function to share across related lambdas.** For example, all your API lambdas might utilise the same hooks, but, your DynamoDB stream lambdas might need to utilise a different set of hooks. Rather than repeating the useHooks call for each lambda, call once and share around the related lambdas...

```javascript
// file: src/hooks/api.js
export const withApiHooks = (lambda, { schema }) =>
    useHooks({
        before: [
            handleScheduledEvent,
            logEvent,
            parseEvent,
            validateEventBody,
        ],
        onError: [handleUnexpectedError],
    }, { schema })(lambda))


// file: src/api/lambda.js
const { withApiHooks } = require('../hooks/api')

...

const main = async event => {...}

export const handler = withApiHooks(main, { schema })
```

-   **Write your own hooks.** It's really easy to do. If you're migrating an existing project over, you already have the logic. So all you would need to do is wrap that logic in a function which recieves and returns the state object.

    Feel free to share any hooks you make by submitting a PR, and here's a boilerplate hook (that does absolutely nothing) to get you started:

```javascript
export const myNewHook = async state => {
    const { event, context, config } = state

    // your logic here....

    return state
}
```

-   **Use TypeScript.** Speaking of which...

## TypeScript 🙌

```typescript
import { APIGatewayProxyEvent } from 'better-lambda-types'
import { useHooks,
    handleScheduledEvent,
    handleUnexpectedError,
    logEvent,
    parseEvent,
} from 'lambda-hooks'

...

const main = async (event: APIGatewayProxyEvent<Body>, context: Context) => {...}

export const handler = useHooks({
        before: [
            handleScheduledEvent,
            logEvent,
            parseEvent,
        ],
        onError: [handleUnexpectedError],
    })(main)
```

Here's some types for more clarity on the explanations above. Note, you don't need to copy & paste these, this is just for comprehension, any types you need can be imported from the package.

```typescript
interface Hooks {
    before?: HookHandler[]
    after?: HookHandler[]
    onError?: HookHandler[]
}

export type Hook = (state: State) => Promise<State>

type UseHooks = (hooks: Hooks, config?: Obj) => WithHooks

type WithHooks = (lambda: any) => (event: any, context: Context) => Promise<any>
```

Now let's get to an example of a hook written in TypeScript. Often when using lambdas in production you'll want to keep some of them warm to avoid cold starts, but if you're doing this, remember to check and quit immediately otherwise you're wasting 💰. That's what this hook does...

```typescript
import { HookCreator } from 'lambda-hooks'

export const handleScheduledEvent: Hook = async state => {
    const { event } = state

    if (event['detail-type'] === 'Scheduled Event') {
        state.exit = true
        state.response = { statusCode: 200 }
    }

    return state
}
```

## Related

-   [**middy**](https://github.com/middyjs/middy) - A special mention needs to go out to the folks at Middy. This project has been heavily inspired by them and solves the same problem.
-   [**lambda-api**](https://github.com/jeremydaly/lambda-api) - Another really cool framework that brings the familiar syntax of frameworks like express & fastify but specifically designed for AWS lambda.
-   [**production-ready-serverless**](https://github.com/sweeetland/production-ready-serverless) - a boilerplate starter project complete with Serverless, TypeScript, lambda-hooks & more...
