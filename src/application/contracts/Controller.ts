export abstract class Controller<TBody = undefined> {
  abstract handle(): Promise<Controller.Response<TBody>>;
}

export namespace Controller {
  export interface Response<TBody> {
    statusCode: number;
    body?: TBody;
  }
}
