import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  ValidationError,
} from '@nestjs/common';
import { getMetadataStorage } from 'class-validator';
import type { Request, Response } from 'express';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';

type HttpExceptionResponse = {
  error?: string;
  message?: string | string[];
};

const VALIDATION_MESSAGE_KEYS: Record<string, string> = {
  isBoolean: 'validation.IS_BOOLEAN',
  isDate: 'validation.IS_DATE',
  isDateString: 'validation.IS_DATE',
  isEmail: 'validation.IS_EMAIL',
  isInt: 'validation.IS_INT',
  isNotEmpty: 'validation.IS_NOT_EMPTY',
  isString: 'validation.IS_STRING',
  maxLength: 'validation.MAX_LENGTH',
  min: 'validation.MIN',
  minLength: 'validation.MIN_LENGTH',
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): unknown {
    if (exception instanceof I18nValidationException) {
      return this.handleValidationException(exception, host);
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error('Unhandled application exception', stack);
    }

    return this.sendResponse(
      host,
      status,
      this.getExceptionResponse(exception),
    );
  }

  private handleValidationException(
    exception: I18nValidationException,
    host: ArgumentsHost,
  ) {
    return this.sendResponse(host, HttpStatus.UNPROCESSABLE_ENTITY, {
      message: this.translateValidationErrors(exception.errors, host),
      error: 'Unprocessable Entity',
    });
  }

  private translateValidationErrors(
    errors: ValidationError[],
    host: ArgumentsHost,
    parentPath = '',
  ): string[] {
    const i18n = I18nContext.current(host);

    return errors.flatMap((error) => {
      const property = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;
      const ownMessages = Object.entries(error.constraints ?? {}).map(
        ([constraintName, defaultMessage]) => {
          const translationKey = VALIDATION_MESSAGE_KEYS[constraintName];
          if (!translationKey || !i18n) {
            return defaultMessage;
          }

          const constraints = this.getConstraintArguments(
            error,
            constraintName,
          );

          return String(
            i18n.t(translationKey, {
              args: {
                property,
                value: error.value as unknown,
                constraints,
              },
            }),
          );
        },
      );
      const childMessages = this.translateValidationErrors(
        error.children ?? [],
        host,
        property,
      );

      return [...ownMessages, ...childMessages];
    });
  }

  private getConstraintArguments(
    error: ValidationError,
    constraintName: string,
  ): Record<string, unknown> {
    if (!error.target) {
      return {};
    }

    const metadata = getMetadataStorage()
      .getTargetValidationMetadatas(error.target.constructor, '', false, false)
      .find(
        (item) =>
          item.propertyName === error.property &&
          (item.name === constraintName || item.type === constraintName),
      );

    return Object.fromEntries(
      (metadata?.constraints ?? []).map((value, index) => [index, value]),
    );
  }

  private sendResponse(
    host: ArgumentsHost,
    status: number,
    exceptionResponse: Required<HttpExceptionResponse>,
  ) {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();

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
