import { Component, Input, OnChanges } from '@angular/core';

/**
 * Defines the progress indicator component.
 * 
 * This component is used to display a progress indicator bar that fills up
 * as the user progresses through a form.
 * 
 * @example
 * ```
 * <app-progress-indicator [current]="current" [max]="max" [color]="color" 
 *  [display]="display" [textColor]="textColor">
 * </app-progress-indicator>
 * ```
 */
@Component({
  selector: 'app-progress-indicator',
  templateUrl: './progress-indicator.component.html',
  styleUrl: './progress-indicator.component.css'
})
export class ProgressIndicatorComponent implements OnChanges {
  @Input() current: number;
  @Input() max: number;
  @Input() color: string;
  @Input() display: boolean;
  @Input() textColor: string;

  constructor() {
    this.current = 1;
    this.max = 5;
    this.color = 'blue';
    this.display = false;
    this.textColor = '#FFECD1';
  }

  ngOnChanges(): void {
    this.changeDisplay();
    this.setWidth();
    this.setColor();
  }
  
  /**
   * Changes progress bar display to either hide or show it.
   */
  changeDisplay() {
    const progressBar = document.getElementById("progressIndicator");
    if (progressBar) {
      progressBar.style.display = this.display ? "flex" : "none";
    }
  }

  /**
   * Updates the width of the progress bar.
   */
  setWidth() {
    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
      progressBar.style.width = `${((this.current) / (this.max)) * 100}%`;
    }
  }

  /**
   * Updates the color of the progress bar.
   */
  setColor() {
    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
      progressBar.style.backgroundColor = this.color;
      progressBar.style.color = this.textColor;
    }
  }
}
