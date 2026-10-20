import { Component, input, Resource } from '@angular/core';
import { ProductModel } from '../types';

@Component({
  selector: 'app-products-details',
  imports: [],
  template: `
    <div class="bg-base-100 rounded-md p-4 m-4">
      @if (product().hasValue()) {
        <p>{{ product().value().name }}</p>
      }
      @if (product().isLoading()) {
        <div class="flex w-64 flex-col gap-4">
          <div class="skeleton h-4 w-28"></div>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-full"></div>
        </div>
      }
    </div>
  `,
  styles: ``,
})
export class Details {
  product = input.required<Resource<ProductModel>>();
}
