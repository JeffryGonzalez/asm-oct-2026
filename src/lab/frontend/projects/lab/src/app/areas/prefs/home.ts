import { JsonPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { Component, effect, signal, Signal } from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
/*{
  "id": "string",
  "version": 1,
  "homeBranch": null,
  "hideReviews": true
}*/

type PrefsModel = {
  id: string;
  version: number;
  homeBranch: string;
  hideReviews: boolean;
};

@Component({
  selector: 'app-patron-prefs',
  imports: [FormRoot, FormField],
  template: `
    @if (form().errors().length > 0) {
      @if (form().getError('conflict')) {
        <div class="alert alert-error">
          <p>Cannot Overwrite - conflict. Make this message less geeky.</p>
          <button class="btn btn-sm btn-warning" (click)="reload()">Reload the Data</button>
        </div>
      }
    }
    <form [formRoot]="form">
      <div class="flex flex-col w-64 gap-4">
        <label class="label flex flex-row gap-2"
          >Home Branch<select [formField]="form.homeBranch" class="select">
            @for (branch of branchesResource.value(); track branch.BRANCH_CD) {
              <option [value]="branch.BRANCH_CD">
                {{ branch.BRANCH_NM }}
              </option>
            }
          </select>
        </label>

        <label class="label flex flex-row gap-2 w-fit"
          >Hide Reviews <input class="checkbox" type="checkbox" [formField]="form.hideReviews" />
        </label>
      </div>

      <button
        [aria-disabled]="form().invalid() || form().submitting()"
        type="submit"
        class="btn btn-success"
      >
        {{ form().submitting() ? 'Saving' : 'Save' }} Your Prefs
      </button>
    </form>
  `,
  styles: ``,
})
export class Home {
  private readonly patronId = 'p201';
  reload() {
    this.prefsResource.reload();
    this.form().reset();
  }
  private readonly branchesResource = httpResource<{ BRANCH_CD: string; BRANCH_NM: string }[]>(
    () => 'https://branches.hypertheory-labs.dev/branches',
  );

  private readonly prefsResource = httpResource<PrefsModel>(
    () => `http://localhost:5261/patrons/${this.patronId}/prefs`,
  );
  // default data for the form
  private readonly model = signal<PrefsModel>({
    id: this.patronId,
    version: -1,
    hideReviews: false,
    homeBranch: '',
  });

  private readonly form = form(
    this.model,
    (schema) => {
      required(schema.homeBranch);
    },
    {
      submission: {
        action: async (field) => {
          // I am going to do this using fetch BECAUSE I CAN, not because you should. ;)
          const m = field().value();
          const body = JSON.stringify({ homeBranch: m.homeBranch, hideReviews: m.hideReviews });

          try {
            const response = await fetch('http://localhost:5261/patrons/p201/prefs', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'If-Match': `${m.version}`,
              },
              body,
            });
            if (!response.ok) {
              console.log(response.status);
              if (response.status === 412) {
                return { kind: 'conflict', message: 'Changes saved elsewhere, cannot overrwite' };
              }
            }
          } catch (error) {
            console.error('Failed to update', error);
          }
          field().reset();
          return;
        },
      },
    },
  );

  constructor() {
    effect(() => {
      if (this.prefsResource.hasValue()) {
        this.model.set(this.prefsResource.value());
      }
    });
  }
}
