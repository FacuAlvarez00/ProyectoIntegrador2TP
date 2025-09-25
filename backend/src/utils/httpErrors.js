export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export class BadRequest extends HttpError {
  constructor(message='Bad Request'){ super(400, message); }
}
export class Unauthorized extends HttpError {
  constructor(message='Unauthorized'){ super(401, message); }
}
