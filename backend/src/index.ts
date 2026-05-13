import dotenv from 'dotenv';
dotenv.config();
// REFRESH_TS: 1778549020469

import express from 'express';
import cors from 'cors';
import figmaRoutes from './routes/figma.js';

const app = express();

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/figma', figmaRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  console.error('!!! [GLOBAL ERROR]', err);
  res.status(500).json({ error: 'Global Server Error', message: err.message });
});

app.get('/health', (req, f_res) => {
  f_res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
