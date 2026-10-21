import { computed, inject } from '@angular/core';
import { withStellarDevtools } from '@hypertheory-labs/stellar-ng-devtools';
import { tapResponse } from '@ngrx/operators';
import { signalStore, type, withComputed } from '@ngrx/signals';
import { addEntity, removeEntity, withEntities } from '@ngrx/signals/entities';
import { Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { mergeMap } from 'rxjs';
import { httpErrorEvents, HttpResponseError, MalFormedDataPayload } from './events';
import { LoggingApi } from './logging-api';
import { http } from 'msw';
type MalformedDataEntity = MalFormedDataPayload & { id: string };
type HttpResponseEntity = HttpResponseError & { id: string };

export const ErrorStore = signalStore(
  withStellarDevtools('ErrorStore', {
    description: 'The Error handling store, with entities',
  }),
  withEntities({
    collection: '_malformed',
    entity: type<MalformedDataEntity>(),
  }),
  withEntities({
    collection: '_http',
    entity: type<HttpResponseEntity>(),
  }),
  withReducer(
    on(httpErrorEvents.errorDismissed, ({ payload }) =>
      removeEntity(payload, { collection: '_malformed' }),
    ),
    on(httpErrorEvents.errorDismissed, ({ payload }) =>
      removeEntity(payload, { collection: '_http' }),
    ),
    on(httpErrorEvents.httpError, (state) => {
      const newError: HttpResponseEntity = {
        id: crypto.randomUUID(),
        ...state.payload,
      };
      return addEntity(newError, { collection: '_http' });
    }),
    on(httpErrorEvents.malformedData, (state) => {
      const newError: MalformedDataEntity = {
        ...state.payload,
        id: crypto.randomUUID(),
      };
      return addEntity(newError, { collection: '_malformed' });
    }),
  ),
  withComputed((state) => ({
    numberOfPendingErrors: computed(
      () => state._malformedEntities().length + state._httpEntities().length,
    ),
    combined: computed(() => {
      const malformed = state._malformedEntities().map((m) => ({
        id: m.id,
        kind: 'malformed',
        featureName: m.featureName,
        message:
          'Malformed Response  ' + m.message + m.featureName ? ' (' + m.featureName + ')' : '',
        url: m.url,
      }));
      const http = state
        ._httpEntities()
        .map((m) => ({
          id: m.id,
          message: m.status,
          url: m.url,
          kind: 'http',
          featureName: m.featureName,
        }));
      return [...malformed, ...http];
    }),
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
