
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.CURSOS_DISPONIBLES_PORT || 3003;
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('Conectado a MongoDB en cursosDisponibles');
}).catch((error) => {
  console.error('Error al conectar a MongoDB:', error);
});

// Define Course schema and model
const courseSchema = new mongoose.Schema({
  nombre: String,
  descripcion: String,
  precio: Number,
  imagen: String,
  videos: [
    {
      title: String,
      url: String
    }
  ]
});
const Course = mongoose.model('Course', courseSchema);

// API endpoint to get courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Error fetching courses' });
  }
});

// API endpoint to get a course by id
app.get('/api/courses/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Error fetching course' });
  }
});

// New endpoint to generate and send token to other equipos
app.get('/api/token', (req, res) => {
  const token = jwt.sign({ access: 'communication' }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Serve videos.html at root
function checkPaymentConfirmation(req, res, next) {
  // Simple check for payment confirmation via query param or cookie
  // For demo, check query param ?paid=true
  if (req.query.paid === 'true') {
    next();
  } else {
    res.status(403).send('Acceso denegado. Debe completar el pago para acceder a los cursos.');
  }
}

app.get('/', checkPaymentConfirmation, (req, res) => {
  res.sendFile(path.join(__dirname, 'videos.html'));
});

app.listen(PORT, () => {
  console.log(`CursosDisponibles corriendo en http://localhost:${PORT}`);
});
