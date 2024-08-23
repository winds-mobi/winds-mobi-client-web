import {
  type Handler,
  type NextFn,
  type RequestContext,
  // @ts-expect-error no TS yet
} from '@ember-data/request';
// import type { Pin } from 'the-mountains-are-calling/services/settings';

export interface Response {
  content: Station[];
}

interface Station {
  _id: string;
  alt: number;
  loc: number;
  peak: any;
  pvName: any;
  short: string;
  status: string;
  last: any;
}

const StationHandler: Handler = {
  async request<T>(context: RequestContext, next: NextFn<T>) {
    const regex = /.*\/stations/;

    if (!regex.test(context.request.url)) return next(context.request);
    // if (context.request.op !== 'station') return next(context.request);

    try {
      const { content } = (await next(context.request)) as Response;

      // JSON-API requires us to have IDs
      // Timestamps should be unique-enough
      const contedWithIds = content.map((elm) => {
        return {
          type: 'station',
          id: elm._id,
          attributes: elm,
        };
      });

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
