export class ServiceError extends Error {
  /** @param {'VALIDATION'|'DUPLICATE'|'FULL'|'CLOSED'|'NOT_FOUND'|'CONFLICT'|'UNAUTHENTICATED'|'FORBIDDEN'|'AUTH'} code */
  constructor(code, message, fields = {}) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.fields = fields;
  }
}
