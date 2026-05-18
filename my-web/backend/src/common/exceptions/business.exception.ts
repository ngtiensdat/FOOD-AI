import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constant';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    errorCode: ErrorCodes,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        errorCode,
      },
      status,
    );
  }
}
