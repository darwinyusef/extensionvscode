export class ExerciseManager {
  constructor(virtualFS, commandParser, validator) {
    this.fs = virtualFS;
    this.parser = commandParser;
    this.validator = validator;
    this.currentExercise = null;
    this.currentStepIndex = 0;
    this.totalPoints = 0;
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  async loadExercise(exerciseId) {
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`);
      const data = await response.json();

      this.currentExercise = data.exercise;
      this.currentStepIndex = 0;
      this.totalPoints = 0;

      if (this.currentExercise.initial_state) {
        if (this.currentExercise.initial_state.filesystem) {
          this.fs.root = this.currentExercise.initial_state.filesystem;
        }
        if (this.currentExercise.initial_state.current_directory) {
          this.fs.currentPath = this.currentExercise.initial_state.current_directory;
        }
        if (this.currentExercise.initial_state.env) {
          Object.assign(this.parser.env, this.currentExercise.initial_state.env);
        }
      }

      this.emit('exerciseLoaded', {
        title: this.currentExercise.title,
        totalSteps: this.currentExercise.steps.length
      });

      this.emit('stepChanged', this.getCurrentStep());

      this.saveProgress();
      return this.currentExercise;
    } catch (error) {
      this.emit('error', { message: `Failed to load exercise: ${error.message}` });
      throw error;
    }
  }

  getCurrentStep() {
    if (!this.currentExercise) return null;
    return this.currentExercise.steps[this.currentStepIndex];
  }

  async validateCommand(command) {
    if (!this.currentExercise) {
      return { valid: false, message: 'No exercise loaded' };
    }

    const step = this.getCurrentStep();
    if (!step) {
      return { valid: false, message: 'No more steps' };
    }

    const result = await this.validator.validate(command, step, this.fs, this.parser.env);

    if (result.correct) {
      this.totalPoints += step.points || 0;

      this.emit('stepCompleted', {
        step: this.currentStepIndex + 1,
        points: step.points || 0,
        totalPoints: this.totalPoints,
        feedback: result.feedback || step.on_correct || 'Correct!'
      });

      this.currentStepIndex++;

      if (this.currentStepIndex >= this.currentExercise.steps.length) {
        this.emit('exerciseCompleted', {
          totalPoints: this.totalPoints,
          exercise: this.currentExercise
        });
      } else {
        this.emit('stepChanged', this.getCurrentStep());
      }

      this.saveProgress();
    } else {
      this.emit('stepFailed', {
        feedback: result.feedback || step.on_wrong || 'Incorrect. Try again.'
      });
    }

    return result;
  }

  saveProgress() {
    if (!this.currentExercise) return;

    const progress = {
      exerciseId: this.currentExercise.id,
      stepIndex: this.currentStepIndex,
      points: this.totalPoints,
      timestamp: Date.now()
    };

    localStorage.setItem(`exercise_${this.currentExercise.id}`, JSON.stringify(progress));
  }

  loadProgress(exerciseId) {
    const saved = localStorage.getItem(`exercise_${exerciseId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  }

  resetExercise() {
    if (this.currentExercise) {
      localStorage.removeItem(`exercise_${this.currentExercise.id}`);
      this.loadExercise(this.currentExercise.id);
    }
  }

  getProgress() {
    if (!this.currentExercise) return { current: 0, total: 0, percent: 0 };

    const total = this.currentExercise.steps.length;
    const current = this.currentStepIndex;
    const percent = Math.round((current / total) * 100);

    return { current, total, percent };
  }
}
