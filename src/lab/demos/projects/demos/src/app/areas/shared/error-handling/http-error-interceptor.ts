// This will see EVERY http request (and response) in the application
// if there is an error, it will dispatch an event

import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { injectDispatch } from '@ngrx/signals/events';
import { catchError } from 'rxjs';
import { httpErrorEvents } from './events';

export function httpErrorInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const dispatcher = injectDispatch(httpErrorEvents);
  console.log(`Got a request to ${req.url} and it is a ${req.method} method`);
  return next(req).pipe(
    catchError((r: HttpErrorResponse) => {
      dispatcher.httpError({ url: r.url || '', status: r.status });
      throw r;
    }),
  );
}
