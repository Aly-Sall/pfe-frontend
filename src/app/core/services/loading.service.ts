import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private activeRequests = 0;

  loading$ = this.loadingSubject.asObservable();

  setLoading(loading: boolean): void {
    if (loading) {
      this.activeRequests++;
    } else {
      this.activeRequests--;
      if (this.activeRequests < 0) {
        this.activeRequests = 0;
      }
    }

    this.loadingSubject.next(this.activeRequests > 0);
  }

  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
