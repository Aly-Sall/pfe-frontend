// src/app/shared/components/question-answer/question-answer.component.ts
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { QuestionDto, ResponseDto } from '../../../core/services/test.service';

@Component({
  selector: 'app-question-answer',
  templateUrl: './question-answer.component.html',
  styleUrls: ['./question-answer.component.scss'],
})
export class QuestionAnswerComponent implements OnInit, OnChanges {
  @Input() question!: QuestionDto;
  @Input() savedAnswerIds: number[] = [];
  @Output() answerChange = new EventEmitter<number[]>();

  selectedAnswerIds: number[] = [];

  constructor() {}

  ngOnInit(): void {
    this.initializeAnswers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['question'] || changes['savedAnswerIds']) {
      this.initializeAnswers();
    }
  }

  private initializeAnswers(): void {
    if (this.savedAnswerIds && this.savedAnswerIds.length > 0) {
      this.selectedAnswerIds = [...this.savedAnswerIds];
    } else {
      this.selectedAnswerIds = [];
    }
  }

  toggleAnswerSelection(responseId: number): void {
    if (this.question.type === 0) {
      // Single choice - Only one answer allowed
      this.selectedAnswerIds = [responseId];
    } else {
      // Multiple choice - Toggle selection
      const index = this.selectedAnswerIds.indexOf(responseId);
      if (index > -1) {
        this.selectedAnswerIds.splice(index, 1);
      } else {
        this.selectedAnswerIds.push(responseId);
      }
    }

    // Emit the selected answers
    this.answerChange.emit(this.selectedAnswerIds);
  }

  isAnswerSelected(responseId: number): boolean {
    return this.selectedAnswerIds.includes(responseId);
  }
}
