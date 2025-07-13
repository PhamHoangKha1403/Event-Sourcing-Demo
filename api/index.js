import express from 'express';
import cors from 'cors';
import apiRoutes from './src/api/routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', apiRoutes);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`✅ API Server is running and listening on port ${PORT}`);
});
