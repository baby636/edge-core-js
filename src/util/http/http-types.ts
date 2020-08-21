export interface HttpHeaders {
  [header: string]: string
}

export interface HttpResponse {
  status?: number
  headers?: HttpHeaders
  body?: string | ArrayBuffer
}

export interface HttpRequest {
  readonly method: string
  readonly path: string
  readonly version: string // 'HTTP/1.1'
  readonly headers: Readonly<HttpHeaders>
}

// A server is just an async function that takes some of request
// and returns an HttpResponse:
export type Server<Request> = (request: Request) => Promise<HttpResponse>
