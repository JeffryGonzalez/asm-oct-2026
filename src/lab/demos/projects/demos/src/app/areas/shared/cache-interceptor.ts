// Intentionally a trival, not ready for production version - but you could make it so.
// if your API does not return cache control headers, and you want to hold on to "some" stuff
// you can also use context ...
import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';

import { of, tap } from 'rxjs';

const cache = new Map<string, HttpResponse<unknown>>();
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Cache the body of a 201 result from a POST (created)
  if (req.method !== 'GET') {
    return next(req);
  }
  // if this is a POST/PUT/DELETE to the thing that is in the cache,
  // invalidate it.

  const key = req.urlWithParams;

  const haveIt = cache.has(key);

  if (haveIt) {
    return of(cache.get(key)!);
  }
  // above this line is the incoming request
  // below this line is after we get a response from the server
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(key, event);
      }
    }),
  );
};
