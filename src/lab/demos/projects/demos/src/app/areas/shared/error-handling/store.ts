import { signalStore, withComputed, withProps } from '@ngrx/signals';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { httpErrorEvents, MalFormedDataPayload } from './events';
import { withEntities, addEntities, addEntity, removeEntity } from '@ngrx/signals/entities';
import { computed, inject } from '@angular/core';
import { map, mergeMap, tap } from 'rxjs';
import { LoggingApi } from './logging-api';
import { withStellarDevtools } from '@hypertheory-labs/stellar-ng-devtools';
import { tapResponse } from '@ngrx/operators';
import { CounterStore } from '../../signals/stores/counter';
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
