export class PaginationDto {
  page?: number;
  limit?: number;
}

export class ApiResponseDto<T> {
  statusCode: number;
  message: string;
  data?: T;
}
