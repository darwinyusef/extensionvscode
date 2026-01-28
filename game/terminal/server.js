import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/exercises', async (req, res) => {
  try {
    const exercisesDir = join(__dirname, 'exercises');
    const files = await fs.readdir(exercisesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const exercises = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(join(exercisesDir, file), 'utf-8');
        const data = JSON.parse(content);
        return {
          id: data.exercise.id,
          title: data.exercise.title,
          category: data.exercise.category,
          difficulty: data.exercise.difficulty,
          filename: file
        };
      })
    );

    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/exercises/:id', async (req, res) => {
  try {
    const exercisesDir = join(__dirname, 'exercises');
    const files = await fs.readdir(exercisesDir);

    for (const file of files) {
      const content = await fs.readFile(join(exercisesDir, file), 'utf-8');
      const data = JSON.parse(content);

      if (data.exercise.id === req.params.id) {
        return res.json(data);
      }
    }

    res.status(404).json({ error: 'Exercise not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/exercise', async (req, res) => {
  try {
    const { topic, seed, level, user } = req.query;

    if (!topic) {
      return res.status(400).json({ error: 'Topic parameter is required' });
    }

    const exercisesDir = join(__dirname, 'exercises');
    const files = await fs.readdir(exercisesDir);

    for (const file of files) {
      const content = await fs.readFile(join(exercisesDir, file), 'utf-8');
      const data = JSON.parse(content);

      if (data.exercise.category?.toLowerCase() === topic.toLowerCase() ||
          data.exercise.id?.toLowerCase().includes(topic.toLowerCase())) {

        if (level && data.exercise.difficulty) {
          const difficultyMap = { '1': 'beginner', '2': 'intermediate', '3': 'advanced' };
          if (difficultyMap[level] !== data.exercise.difficulty.toLowerCase()) {
            continue;
          }
        }

        return res.json(data);
      }
    }

    res.status(404).json({ error: 'Exercise not found for the given parameters' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/validate', async (req, res) => {
  try {
    const { command, expected, context } = req.body;

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        correct: false,
        feedback: 'API key not configured. Using basic validation.',
        score: 0
      });
    }

    let systemPrompt = 'You are a Linux/DevOps instructor validating student work. Return JSON with {correct: boolean, feedback: string, score: number}.';
    let userPrompt = '';

    if (context.type === 'dockerfile') {
      systemPrompt = `You are a Docker expert reviewing a student's Dockerfile.

Analyze the entire Dockerfile and provide detailed feedback on:
1. Correct use of instructions (FROM, WORKDIR, COPY, RUN, CMD, etc.)
2. Best practices (image optimization, layer caching, security)
3. Syntax errors or missing required instructions
4. Improvements that could be made

Return JSON with:
{
  "correct": boolean (true if it's a valid, working Dockerfile),
  "feedback": string (detailed feedback with specific suggestions),
  "score": number (0-100)
}`;

      userPrompt = `Student's Dockerfile:

\`\`\`dockerfile
${command}
\`\`\`

Exercise: ${context.exercise}
Expected: ${expected}

Provide comprehensive feedback on the entire Dockerfile.`;
    } else {
      userPrompt = `Command executed: ${command}\nExpected behavior: ${expected}\nContext: ${JSON.stringify(context)}\n\nValidate if the command achieves the expected goal.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const aiResponse = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(aiResponse);
      res.json(parsed);
    } catch {
      res.json({ correct: false, feedback: aiResponse, score: 0 });
    }
  } catch (error) {
    console.error('AI validation error:', error);
    res.status(500).json({
      correct: false,
      feedback: `Error al validar: ${error.message}`,
      score: 0
    });
  }
});

app.listen(PORT, () => {
  console.log(`Terminal simulator running on http://localhost:${PORT}`);
});
