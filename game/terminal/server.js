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

app.post('/api/ai/validate', async (req, res) => {
  try {
    const { command, expected, context } = req.body;

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
            content: 'You are a Linux/DevOps instructor validating student commands. Return JSON with {correct: boolean, feedback: string, score: number}.'
          },
          {
            role: 'user',
            content: `Command executed: ${command}\nExpected behavior: ${expected}\nContext: ${JSON.stringify(context)}\n\nValidate if the command achieves the expected goal.`
          }
        ],
        temperature: 0.3
      })
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(aiResponse);
      res.json(parsed);
    } catch {
      res.json({ correct: false, feedback: aiResponse, score: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Terminal simulator running on http://localhost:${PORT}`);
});
