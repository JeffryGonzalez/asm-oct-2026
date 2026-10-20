import { computed, inject } from '@angular/core';
import { withStellarDevtools } from '@hypertheory-labs/stellar-ng-devtools';
import { tapResponse } from '@ngrx/operators';
import { signalStore, withComputed } from '@ngrx/signals';
import { addEntity, removeEntity, withEntities } from '@ngrx/signals/entities';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mergeMap } from 'rxjs';
import { httpErrorEvents, MalFormedDataPayload } from './events';
import { LoggingApi } from './logging-api';
type MalformedDataEntity = MalFormedDataPayload & { id: string };
export const ErrorStore = signalStore(
  withStellarDevtools('ErrorStore', {
    description: 'The Error handling store, with entities',
  }),
  withEntities<MalformedDataEntity>(),
  withReducer(
    on(httpErrorEvents.errorDismissed, ({ payload }) => removeEntity(payload)),
    on(httpErrorEvents.malformedData, (state) => {
      const newError: MalformedDataEntity = {
        ...state.payload,
        id: crypto.randomUUID(),
      };
      return addEntity(newError);
    }),
  ),
  withComputed((state) => ({
    numberOfPendingErrors: computed(() => state.entities().length),
  })),
  // event handlers are like 'effects' in ngrx store
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
