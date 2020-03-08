# lambda-hooks

**Super lightweight module to _hook_ into the execution of your Node.js lambda functions**

Lambda Hooks helps avoid repeated logic in your lambda functions. Use some of the provided hooks or easily create your own (they are just functions). They can be executed before, after or when an unhandled error occurs.

## Features

-   Minimal and fast (~40 lines of code)
-   Simple to use
-   Easily create your own hooks using modern syntax (async await)
-   First class support for TypeScript

## Example

```javascript
const  useHooks, {handleScheduledEvent, logEvent, parseEvent, handleUnexpectedError} = require('lambda-hooks')

// call useHooks with the hooks to decorate your lambda with
const  applyHooks = useHooks({
	before: [handleScheduledEvent(), logEvent(), parseEvent()],
	after: [],
	onError: [handleUnexpectedError()]
})

// must be an async lambda!
const  handler = async (event, context) => {
	// write your lambda function as normal...
}

// call applyHooks passing in your lambda function & it
// returns your lambda decorated with the hooks specified above
module.exports = applyHooks(handler)
```

## Installing

Using npm run:

```bash
npm install lambda-hooks
```

or with yarn:

```bash
yarn add lambda-hooks
```
