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

// I intend for you to be able to sort by these things
// type SortableThingy = Omit<ProductModel, 'id'>
const SortColumns = ['name', 'price'] as const;
export type SortOption = (typeof SortColumns)[number];

// copy this somewhere handy
export function assertNever(x: never): never {
  // this will throw ONLY if this is being called from JavaScript, and not TypeScript
  // TypeScript will not compile - it will type error - on anything 'never'
  throw new Error('You were not supposed to ever get here, yo');
}
export const ProductsStore = signalStore(
  withState({
    hasError: false,
    sortOption: 'name' as SortOption,
  }),
  withProps((store, events = injectDispatch(httpErrorEvents)) => ({
    _errors: inject(ErrorStore),
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
    productErrors: computed(() =>
      store._errors.combined().filter((e) => e.featureName === 'products'),
    ),
    sortedProductList: computed(() => {
      const list = store.productsListResource.value() ?? [];
      let opt = store.sortOption();
      if (!!opt) {
        opt = 'name' as SortOption;
      }
      switch (opt) {
        case 'name':
          return list.toSorted((a, b) => a.name.localeCompare(b.name));
        case 'price':
          return list.toSorted((a, b) => (a.price === b.price ? 0 : a.price > b.price ? -1 : 1));

        default:
          return [];
        //   assertNever(opt);
      }
    }),
  })),
);
