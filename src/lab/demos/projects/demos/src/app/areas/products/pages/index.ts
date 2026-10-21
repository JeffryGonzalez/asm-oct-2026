import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import type { SortOption } from '../stores/products';
import { Component, effect, inject, input } from '@angular/core';
import { RouterLinkWithHref, RouterOutlet } from '@angular/router';
import { ProductsStore } from '../stores/products';

@Component({
  selector: 'app-products-index',
  imports: [CurrencyPipe, RouterOutlet, RouterLinkWithHref, TitleCasePipe],
  template: `
    <p>Products Index Page</p>
    <div class="join">
      @for (opt of store.sortColumns; track $index) {
        <a
          [aria-disabled]="store.sortOption() === opt"
          [routerLink]="['.', { sortOption: opt }]"
          class="join-item btn"
        >
          Sort by {{ opt | titlecase }}
        </a>
      }
    </div>
    <div class="flex h-12">
      @if (store.productsListResource.isLoading()) {
        <p>Getting your products...</p>
        <span class="loading loading-lg loading-ball"></span>
      }
    </div>
    @if (store.productsListResource.hasValue()) {
      <div class="flex flex-row gap-4">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <!-- row 1 -->
              @for (product of store.sortedProductList(); track product.id) {
                <tr>
                  <th>{{ product.id }}</th>
                  <td>
                    <a class="link" [routerLink]="['.', product.id]">{{ product.name }}</a>
                  </td>
                  <td>{{ product.price | currency }}</td>
                </tr>
              } @empty {
                <tr>
                  <th></th>
                  <td>No Products Available!</td>
                  <td></td>
                </tr>
              }
              <!-- row 2 -->
            </tbody>
          </table>
        </div>
        <div>
          <p>Details</p>
          <router-outlet />
        </div>
      </div>
    }
    @if (store.productErrors().length > 0) {
      <div class="alert alert-error">
        @for (error of store.productErrors(); track error.id) {
          <p>{{ error.message }} ({{ error.featureName }}) {{ error.url }}</p>
        }
      </div>
    }
  `,
  styles: ``,
})
export class Index {
  private readonly store = inject(ProductsStore);
  sortOption = input<SortOption>('name');

  constructor() {
    // Note: The (other) use of an effect I promised. Syncing inputs with the store.
    effect(() => {
      this.store.setSortOption(this.sortOption());
    });
  }
}
