import { CurrencyPipe, JsonPipe } from '@angular/common';
import { Component, computed, input, Resource, signal } from '@angular/core';
import { RouterLinkWithHref, RouterOutlet } from '@angular/router';
import { Product } from '../../../../mocks/data/products';
import { httpResource, HttpResourceRef } from '@angular/common/http';
import { ProductModel } from '../types';

@Component({
  selector: 'app-products-index',
  imports: [CurrencyPipe, RouterOutlet, RouterLinkWithHref, JsonPipe],
  template: `
    <p>Products Index Page</p>
    <div class="join">
      <button
        (click)="sortKey.set('name')"
        [aria-disabled]="sortKey() === 'name'"
        class="join-item btn"
      >
        Sort by Name
      </button>
      <button
        (click)="sortKey.set('price')"
        [aria-disabled]="sortKey() === 'price'"
        class="join-item btn"
      >
        Sort by Price
      </button>
    </div>
    @if (productsResource.isLoading()) {
      <p>Getting your products...</p>
      <span class="loading loading-lg loading-ball"></span>
    }
    @if (productsResource.hasValue()) {
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
              @for (product of sortedProducts(); track product.id) {
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

    @if (productsResource.error()) {
      <p>Blammo</p>
    }
    <pre>
    If you are blocking, you just get the list,
    if you are non-blocking, you get a HttpResourceRef that you can interact with.
    
    {{ list() | json }}</pre>
  `,
  styles: ``,
})
export class Index {
  private readonly productsResource = httpResource<ProductModel[]>(() => '/api/products');
  list = input<HttpResourceRef<ProductModel[]>>();
  private readonly sortKey = signal<'price' | 'name'>('name');
  sortedProducts = computed(() => {
    const list = this.productsResource.value() ?? [];
    // return list.toSorted((a, b) => (a.price === b.price ? 0 : a.price > b.price ? -1 : 1));
    if (this.sortKey() === 'name') {
      return list.toSorted((a, b) => a.name.localeCompare(b.name));
    } else {
      return list.toSorted((a, b) => (a.price === b.price ? 0 : a.price > b.price ? -1 : 1));
    }
  });
}
