export class EndpointError extends Error {
  code: number
  constructor(message?: string, code?: number, options?: ErrorOptions) {
    super(message, options)
    this.code = code ?? 500
  }
}
