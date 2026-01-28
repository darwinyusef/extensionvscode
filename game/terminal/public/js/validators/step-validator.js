export class StepValidator {
  constructor() {
    this.validationTypes = {
      'command_exact': this.validateCommandExact.bind(this),
      'command_pattern': this.validateCommandPattern.bind(this),
      'command_with_fs_check': this.validateCommandWithFsCheck.bind(this),
      'state_check': this.validateStateCheck.bind(this),
      'file_content_check': this.validateFileContentCheck.bind(this),
      'ai_validation': this.validateAI.bind(this),
      'complex_ai': this.validateComplexAI.bind(this)
    };
  }

  async validate(command, step, fs, env) {
    const validation = step.validation;
    const validationType = validation.type;

    if (!this.validationTypes[validationType]) {
      return {
        correct: false,
        feedback: `Unknown validation type: ${validationType}`
      };
    }

    return await this.validationTypes[validationType](command, validation, fs, env);
  }

  validateCommandExact(command, validation, fs, env) {
    const expected = validation.expected_command;
    const alternatives = validation.alternative_commands || [];
    const allValid = [expected, ...alternatives];

    const commandMatch = allValid.some(valid => {
      const cmdParts = command.trim().split(/\s+/);
      const validParts = valid.trim().split(/\s+/);
      return cmdParts[0] === validParts[0];
    });

    return {
      correct: commandMatch,
      feedback: commandMatch ? null : `Expected: ${expected}`
    };
  }

  validateCommandPattern(command, validation, fs, env) {
    const pattern = new RegExp(validation.pattern);
    const match = pattern.test(command);

    return {
      correct: match,
      feedback: match ? null : `Command should match pattern: ${validation.pattern}`
    };
  }

  validateCommandWithFsCheck(command, validation, fs, env) {
    const cmdValid = this.validateCommandExact(command, validation, fs, env);
    if (!cmdValid.correct) return cmdValid;

    const checks = validation.fs_checks || [];
    for (const check of checks) {
      if (check.type === 'file_exists') {
        if (!fs.exists(check.path)) {
          return {
            correct: false,
            feedback: `File ${check.path} should exist`
          };
        }
      } else if (check.type === 'directory_exists') {
        if (!fs.isDirectory(check.path)) {
          return {
            correct: false,
            feedback: `Directory ${check.path} should exist`
          };
        }
      } else if (check.type === 'file_not_exists') {
        if (fs.exists(check.path)) {
          return {
            correct: false,
            feedback: `File ${check.path} should not exist`
          };
        }
      }
    }

    return { correct: true, feedback: null };
  }

  validateStateCheck(command, validation, fs, env) {
    const checks = validation.checks || [];

    for (const check of checks) {
      if (check.type === 'current_directory') {
        if (fs.getCurrentPath() !== check.value) {
          return {
            correct: false,
            feedback: `Current directory should be ${check.value}`
          };
        }
      } else if (check.type === 'env_var') {
        if (env[check.name] !== check.value) {
          return {
            correct: false,
            feedback: `Environment variable ${check.name} should be ${check.value}`
          };
        }
      }
    }

    return { correct: true, feedback: null };
  }

  validateFileContentCheck(command, validation, fs, env) {
    try {
      const content = fs.readFile(validation.file_path);

      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        const match = regex.test(content);
        return {
          correct: match,
          feedback: match ? null : `File content should match pattern: ${validation.pattern}`
        };
      }

      if (validation.contains) {
        const match = content.includes(validation.contains);
        return {
          correct: match,
          feedback: match ? null : `File should contain: ${validation.contains}`
        };
      }

      return { correct: true, feedback: null };
    } catch (error) {
      return {
        correct: false,
        feedback: error.message
      };
    }
  }

  async validateAI(command, validation, fs, env) {
    try {
      let content = '';

      if (validation.file_path) {
        try {
          content = fs.readFile(validation.file_path);
        } catch (error) {
          return {
            correct: false,
            feedback: `File ${validation.file_path} not found. Please create the file first.`
          };
        }
      } else {
        content = command;
      }

      const response = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: content,
          expected: validation.ai_prompt || 'Validate this content',
          context: {
            type: 'dockerfile',
            exercise: 'Docker Fundamentals',
            file_path: validation.file_path
          }
        })
      });

      const result = await response.json();

      return {
        correct: result.correct,
        feedback: result.feedback,
        score: result.score || 0
      };
    } catch (error) {
      return {
        correct: false,
        feedback: `AI validation failed: ${error.message}`
      };
    }
  }

  async validateComplexAI(command, validation, fs, env) {
    try {
      const context = {
        command,
        filesystem: fs.serialize(),
        env,
        ...validation.context
      };

      const response = await fetch('/api/ai/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          expected: validation.expected_behavior,
          context
        })
      });

      const result = await response.json();

      return {
        correct: result.correct,
        feedback: result.feedback,
        score: result.score
      };
    } catch (error) {
      return {
        correct: false,
        feedback: `AI validation failed: ${error.message}`
      };
    }
  }
}
