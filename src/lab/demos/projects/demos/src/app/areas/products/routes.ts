import { Home } from './home';
import { nonBlocking, type Routes } from '@angular/router';
import { Index } from './pages';
import { Details } from './pages/details';
import { httpResource } from '@angular/common/http';
import { ProductModel } from './types';
import { Todos } from './pages/todos';
import { ProductsStore } from './stores/products';
import { inject } from '@angular/core';

export const productsRoutes: Routes = [
  {
    path: '',
    component: Home,
    providers: [ProductsStore],
    children: [
      {
        path: 'todos',
        component: Todos,
      },
      {
        path: '', // shows the list
        component: Index,
        resources: () => {
          const store = inject(ProductsStore);
          return { list: nonBlocking(store.productsListResource) };
        },
        children: [
          {
            path: ':id',
            component: Details,
            resources: (ctx) => ({
              product: nonBlocking(httpResource(() => `/api/products/${ctx.params()['id']}`)),
            }),
          },
        ],
      },
    ],
  },
];
