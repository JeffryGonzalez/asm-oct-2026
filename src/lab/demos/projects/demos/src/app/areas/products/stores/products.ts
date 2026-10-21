import { httpResource } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { injectDispatch } from '@ngrx/signals/events';
import { httpErrorEvents } from '../../shared/error-handling/events';
import { ProductModel, productSummaryItemListSchema } from '../types';
import { ErrorStore } from '../../shared/error-handling/store';

const SortColumns: (keyof ProductModel)[] = ['name', 'price'] as const;
export type SortOption = (typeof SortColumns)[number];

export const ProductsStore = signalStore(
  withState({
    hasError: false,
    sortOption: 'name' as SortOption,
  }),
  withProps((store, events = injectDispatch(httpErrorEvents)) => ({
    errors: inject(ErrorStore),
    sortColumns: SortColumns,
    productsListResource: httpResource<ProductModel[]>(() => '/api/products', {
      parse: (val) => {
        const parseResults = productSummaryItemListSchema.safeParse(val);
        if (parseResults.success) {
          return parseResults.data;
        } else {
          events.malformedData({
            message: 'Cannot get the product list',
            zodError: parseResults.error,
            featureName: 'products',
            url: '/api/products',
          });
          patchState(store, { hasError: true });
          // dispatch an action
          throw new Error('Malformed Data');
        }
      },
    }),
  })),
  withMethods((store) => ({
    setSortOption: (sortOption: SortOption) => patchState(store, { sortOption }),
  })),
  withComputed((store) => ({
    productErrors: computed(() => store.errors.combined()),
    sortedProductList: computed(() => {
      const list = store.productsListResource.value() ?? [];
      if (store.sortOption() === 'name') {
        return list.toSorted((a, b) => a.name.localeCompare(b.name));
      } else {
        return list.toSorted((a, b) => (a.price === b.price ? 0 : a.price > b.price ? -1 : 1));
      }
    }),
  })),
);
