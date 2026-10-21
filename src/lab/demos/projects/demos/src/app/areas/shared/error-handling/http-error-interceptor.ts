// This will see EVERY http request (and response) in the application
// if there is an error, it will dispatch an event

import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { injectDispatch } from '@ngrx/signals/events';
import { catchError } from 'rxjs';
import { httpErrorEvents } from './events';

export function httpErrorInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const dispatcher = injectDispatch(httpErrorEvents);
  // up here is our opportunity to "look at" the outgoing http request.
  // a common thing is to do logging, otel, stuff, or
  // clone the request, add headers, etc (Authorization) and send that cloned version.
  return next(req).pipe(
    catchError((r: HttpErrorResponse) => {
      dispatcher.httpError({ url: r.url || 'unknown', status: r.status });
      throw r;
    }),
  );
}
