import type { ZodType } from 'zod';

export abstract class Controller<
  TType extends Controller.RouteType,
  TResponse = undefined,
> {
  protected readonly bodySchema: ZodType | undefined = undefined;

  protected abstract handle(
    request: Controller.Request<TType>,
  ): Promise<Controller.Response<TResponse>>;

  execute(
    request: Controller.Request<TType>,
  ): Promise<Controller.Response<TResponse>> {
    return this.handle({
      ...request,
      body: (this.bodySchema
        ? this.bodySchema.parse(request.body)
        : request.body) as Controller.Request<TType>['body'],
    });
  }
}

export namespace Controller {
  export type RouteType = 'public' | 'private';

  interface BaseRequest<TBody> {
    body: TBody;
  }

  export type Request<
    TType extends RouteType,
    TBody = Record<string, unknown>,
  > = BaseRequest<TBody> & {
    accountId: TType extends 'private' ? string : null;
  };

  export interface Response<TBody> {
    statusCode: number;
    body?: TBody;
  }
}
