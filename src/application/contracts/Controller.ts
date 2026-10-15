export interface ControllerResponse<TBody> {
  statusCode: number;
  body?: TBody;
}

export abstract class Controller<TBody = undefined> {
  abstract handle(): Promise<ControllerResponse<TBody>>;
}
