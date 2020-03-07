import { APIGatewayProxyResult } from 'aws-lambda'

type Obj = { [k: string]: any }
type Body = string | Obj
type ResponseMethod = (body?: Body) => APIGatewayProxyResult

const response = (statusCode: number, body?: Body): APIGatewayProxyResult => ({
    statusCode,
    body: typeof body === 'string' ? body : JSON.stringify(body),
})

const responseMethod = (status: number): ResponseMethod => body => {
    console.log(`returning a ${status} response with body: ${body}`)

    return response(status, body)
}

export const OK = responseMethod(200)
export const BAD_REQUEST = responseMethod(400)
export const SERVER_ERROR = responseMethod(500)
