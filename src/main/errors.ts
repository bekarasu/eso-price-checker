export class ServerError extends Error {
  private level: 'critical' | 'warning';

  constructor(
    level: 'critical' | 'warning',
    message: string,
    options?: ErrorOptions | undefined,
  ) {
    super(message, options);
    this.level = level;
  }

  isCritical() {
    return this.level === 'critical';
  }
}
