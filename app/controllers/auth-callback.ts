import Controller from '@ember/controller';

// Declares the `ott` query param so the router materializes it for the
// route's model hook; the one-time token itself is consumed there.
export default class AuthCallbackController extends Controller {
  queryParams = ['ott'];

  ott: string | null = null;
}
