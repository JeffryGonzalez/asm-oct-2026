import { inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { signalStoreFeature } from '@ngrx/signals';
import { withEventHandlers, Events } from '@ngrx/signals/events';
import { mergeMap } from 'rxjs';
import { httpErrorEvents } from './events';
import { LoggingApi } from './logging-api';

export function withSplunkErrorLogging() {
  return signalStoreFeature(
    withEventHandlers((_, events = inject(Events), service = inject(LoggingApi)) => ({
      sendMalformedDataToOtherApi$: events.on(httpErrorEvents.malformedData).pipe(
        mergeMap((err) =>
          service
            .sendToLoggingEndPoint({ msg: err.payload.message, additional: err.payload.zodError })
            .pipe(
              tapResponse({
                next(value) {
                  console.log(value.trackingId);
                },
                error(error) {
                  console.error('The error');
                },
              }),
            ),
        ),
      ),
    })),
  );
}
