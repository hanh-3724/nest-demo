import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  I18nValidationException,
  I18nValidationExceptionFilter,
} from 'nestjs-i18n';

type HttpExceptionResponse = {
  error?: string;
  message?: string | string[];
};

@Catch()
export class ApiExceptionFilter
  extends I18nValidationExceptionFilter
  implements ExceptionFilter
{
  private readonly logger = new Logger(ApiExceptionFilter.name);

  constructor() {
    super({
      detailedErrors: false,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      responseBodyFormatter: (host, _exception, errors) => {
        const request = host.switchToHttp().getRequest<Request>();
        return {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: errors,
          error: 'Unprocessable Entity',
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      },
    });
  }

  catch(exception: unknown, host: ArgumentsHost): unknown {
    if (exception instanceof I18nValidationException) {
      return super.catch(exception, host);
    }

    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error('Unhandled application exception', stack);
    }

    const exceptionResponse = this.getExceptionResponse(exception);

    return response.status(status).json({
      statusCode: status,
      message: exceptionResponse.message,
      error: exceptionResponse.error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getExceptionResponse(
    exception: unknown,
  ): Required<HttpExceptionResponse> {
    if (!(exception instanceof HttpException)) {
      return {
        message: 'Internal server error',
        error: 'Internal Server Error',
      };
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return {
        message: response,
        error: this.getErrorName(exception.getStatus()),
      };
    }

    const body = response as HttpExceptionResponse;
    return {
      message: body.message ?? exception.message,
      error: body.error ?? this.getErrorName(exception.getStatus()),
    };
  }

  private getErrorName(status: number): string {
    const names: Partial<Record<number, string>> = {
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };

    return names[status] ?? 'Error';
  }
}
