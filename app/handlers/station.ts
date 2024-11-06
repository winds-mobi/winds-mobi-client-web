import {
  type Handler,
  type NextFn,
  type RequestContext,
} from '@ember-data/request';

export interface Response {
  content: StationApiPayload[];
}

interface StationApiPayload {
  _id: string;
}

function jsonApifyFields(elm: StationApiPayload) {
  return {
    type: 'station',
    id: elm._id,
    attributes: elm,
  };
}

const StationHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    const isHistoric = /.*\/historic\//;
    const isStation = /.*\/station\//;
    const url = context.request.url || '';

    if (isHistoric.test(url) && !isStation.test(url)) {
      return next(context.request);
    }

    try {
      const { content } = (await next(context.request)) as Response;

      // JSON-API requires us to have IDs
      // Timestamps should be unique-enough
      const contedWithIds = Array.isArray(content)
        ? content.map((elm) => jsonApifyFields(elm))
        : jsonApifyFields(content);

      const jsonApiLikeData = {
        links: {
          self: context.request.url,
        },
        data: contedWithIds,
      };

      return jsonApiLikeData as T;
    } catch (e) {
      console.log('StationHandler.request().catch()', { e });
      throw e;
    }
  },
};

export default StationHandler;
