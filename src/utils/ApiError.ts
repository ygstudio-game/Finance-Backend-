/**
 * Custom Error class for Aegis Terminal API
 * Standardizes the error response format across the backend.
 */
interface ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
}
class ApiError extends Error {
  public statusCode: number;
  public data: null;
  public success: boolean;
  public errors: any[];

  constructor(
    statusCode: number,
    message: string = "Something went wrong",
    errors: any[] = [],
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null; // Errors should not carry data
    this.message = message;
    this.success = false; // Always false for errors
    this.errors = errors;

if (stack) {
    this.stack = stack;
} else {
    (Error as unknown as ErrorConstructor).captureStackTrace(this, this.constructor);
}
  }
}

export { ApiError };