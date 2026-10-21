import { Service, signal } from '@angular/core';

type SseMessage = {
  status: string;
  message: string;
};
@Service()
export class SseService {
  private eventSource?: EventSource;
  readonly messages = signal<SseMessage[]>([]);

  connect(id: string) {
    this.eventSource = new EventSource(`http://localhost:5621/library-card-requests/${id}/events`, {
      withCredentials: false,
    });
    this.eventSource.onopen = () => {
      console.log('It is open');
    };

    this.eventSource.onmessage = (event) => {
      const x = 2 + 1; // debug point.
    };
  }
}
