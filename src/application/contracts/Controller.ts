import { getSchema } from '@kernel/decorators/Schema';

export abstract class Controller<
  TType extends Controller.RouteType,
  TResponse = undefined,
> {
  protected abstract handle(
    request: Controller.Request<TType>,
  ): Promise<Controller.Response<TResponse>>;

  execute(
    request: Controller.Request<TType>,
  ): Promise<Controller.Response<TResponse>> {
    const schema = getSchema(this);

    return this.handle({
      ...request,
      body: (schema?.body
        ? schema.body.parse(request.body)
        : request.body) as Controller.Request<TType>['body'],
    });
  }
}

export namespace Controller {
  export type RouteType = 'public';

  interface BaseRequest<TBody> {
    body: TBody;
  }

  export type Request<
    TType extends RouteType,
    TBody = Record<string, unknown>,
  > = TType extends 'public' ? BaseRequest<TBody> : never;

  export interface Response<TBody> {
    statusCode: number;
    body?: TBody;
  }
}
