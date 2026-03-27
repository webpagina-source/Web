require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_tu_clave_secreta_aqui'); // Configura tu clave secreta de Stripe

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_aqui'; // Cambia esto en producción

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conectar a MongoDB (usa MongoDB Atlas o local)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cursosvirtual';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Modelos
const UserSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true },
  password: String,
  role: String, // 'profesor' o 'estudiante'
  createdAt: { type: Date, default: Date.now }
});

const CourseSchema = new mongoose.Schema({
  name: String,
  professorId: mongoose.Schema.Types.ObjectId,
  price: { type: Number, default: 0 }, // Precio del curso
  createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  courseId: mongoose.Schema.Types.ObjectId,
  professorId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const EnrollmentRequestSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  courseId: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: 'Pendiente' }, // Pendiente / Aprobado / Rechazado
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const EnrollmentSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  courseId: mongoose.Schema.Types.ObjectId,
  paymentMethod: String,
  paymentStatus: String,
  approvalStatus: String,
  stripePaymentMethodId: String,
  professorComment: String,
  createdAt: { type: Date, default: Date.now }
});

const EnrollmentRequest = mongoose.model('EnrollmentRequest', EnrollmentRequestSchema);
const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);

const QuestionnaireSchema = new mongoose.Schema({
  title: String,
  questions: Array,
  courseId: mongoose.Schema.Types.ObjectId,
  professorId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  fromUserId: mongoose.Schema.Types.ObjectId,
  toUserId: mongoose.Schema.Types.ObjectId,
  subject: String,
  message: String,
  type: { type: String, default: 'general' }, // 'general', 'payment_request', etc.
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const ResponseSchema = new mongoose.Schema({
  questionnaireId: mongoose.Schema.Types.ObjectId,
  studentId: mongoose.Schema.Types.ObjectId,
  answers: Array,
  score: Number,
  submittedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Course = mongoose.model('Course', CourseSchema);
const Task = mongoose.model('Task', TaskSchema);
const Questionnaire = mongoose.model('Questionnaire', QuestionnaireSchema);
const Response = mongoose.model('Response', ResponseSchema);

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido' });
  }
};

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ fullName, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (err) {
    res.status(400).json({ error: 'Error registrando usuario' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;
    console.log('Intento de login:', email, 'Rol esperado:', expectedRole);
    const user = await User.findOne({ email });
    console.log('Usuario encontrado:', user ? { email: user.email, role: user.role } : 'No encontrado');
    if (!user) {
      console.log('Usuario no encontrado');
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }
    if (user.role !== expectedRole) {
      console.log('Rol no coincide: esperado', expectedRole, 'actual', user.role);
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      console.log('Contraseña incorrecta');
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token, user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    console.log('Error en login:', err);
    res.status(500).json({ error: 'Error en login' });
  }
});

// Rutas para cursos
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const courses = await Course.find({ professorId: req.user._id });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo cursos' });
  }
});

// Ruta pública para ver cursos disponibles (sin autenticación)
app.get('/api/courses/public', async (req, res) => {
  try {
    const courses = await Course.find({}).populate('professorId', 'fullName');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo cursos públicos' });
  }
});

app.post('/api/courses', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const course = new Course({ name, professorId: req.user._id });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ error: 'Error creando curso' });
  }
});

// Rutas para tareas
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ professorId: req.user._id });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo tareas' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, courseId } = req.body;
    const task = new Task({ title, description, courseId, professorId: req.user._id });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: 'Error creando tarea' });
  }
});

// Rutas para estudiantes (solo profesores)
app.get('/api/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'profesor') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const students = await User.find({ role: 'estudiante' });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo estudiantes' });
  }
});

// Rutas para cuestionarios
app.get('/api/questionnaires', authenticateToken, async (req, res) => {
  try {
    const questionnaires = await Questionnaire.find({ professorId: req.user._id });
    res.json(questionnaires);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo cuestionarios' });
  }
});

app.post('/api/questionnaires', authenticateToken, async (req, res) => {
  try {
    const { title, questions, courseId } = req.body;
    const questionnaire = new Questionnaire({ title, questions, courseId, professorId: req.user._id });
    await questionnaire.save();
    res.status(201).json(questionnaire);
  } catch (err) {
    res.status(400).json({ error: 'Error creando cuestionario' });
  }
});

// Rutas para respuestas
app.get('/api/responses', authenticateToken, async (req, res) => {
  try {
    const responses = await Response.find({ studentId: req.user._id });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo respuestas' });
  }
});

app.post('/api/responses', authenticateToken, async (req, res) => {
  try {
    const { questionnaireId, answers, score } = req.body;
    const response = new Response({ questionnaireId, studentId: req.user._id, answers, score });
    await response.save();
    res.status(201).json(response);
  } catch (err) {
    res.status(400).json({ error: 'Error guardando respuesta' });
  }
});

// Rutas para solicitudes de inscripción
app.post('/api/enrollment-requests', authenticateToken, async (req, res) => {
  if (req.user.role !== 'estudiante') return res.status(403).json({ error: 'Solo estudiantes pueden enviar solicitudes' });
  try {
    const { courseId } = req.body;
    const request = new EnrollmentRequest({ studentId: req.user._id, courseId });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ error: 'Error enviando solicitud' });
  }
});

app.get('/api/enrollment-requests', authenticateToken, async (req, res) => {
  if (req.user.role !== 'profesor') return res.status(403).json({ error: 'Solo profesores pueden ver solicitudes' });
  try {
    const requests = await EnrollmentRequest.find({}).populate('studentId', 'fullName email').populate('courseId', 'name');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo solicitudes' });
  }
});

app.put('/api/enrollment-requests/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'profesor') return res.status(403).json({ error: 'Solo profesores pueden aprobar solicitudes' });
  try {
    const { status, comment } = req.body;
    const request = await EnrollmentRequest.findByIdAndUpdate(req.params.id, { status, comment }, { new: true });
    if (status === 'Aprobado') {
      // Crear inscripción
      const enrollment = new Enrollment({ studentId: request.studentId, courseId: request.courseId, approvalStatus: 'Aprobado' });
      await enrollment.save();
    }
    res.json(request);
  } catch (err) {
    res.status(400).json({ error: 'Error actualizando solicitud' });
  }
});

// Rutas para inscripciones
app.get('/api/enrollments', authenticateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo inscripciones' });
  }
});

app.get('/api/enrollments/pending', authenticateToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ approvalStatus: 'Pendiente' });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo inscripciones pendientes' });
  }
});

app.post('/api/enrollments', authenticateToken, async (req, res) => {
  try {
    const { courseId, paymentMethod, stripePaymentMethodId } = req.body;
    const enrollment = new Enrollment({
      studentId: req.user._id,
      courseId,
      paymentMethod: paymentMethod || 'Sin método',
      paymentStatus: 'Pendiente',
      approvalStatus: 'Pendiente',
      stripePaymentMethodId: stripePaymentMethodId || ''
    });
    await enrollment.save();
    res.status(201).json(enrollment);
  } catch (err) {
    res.status(400).json({ error: 'Error inscribiendo', details: err.message });
  }
});

app.patch('/api/enrollments/:id/approval', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: approve/reject
    const enrollment = await Enrollment.findById(id);
    if (!enrollment) return res.status(404).json({ error: 'Inscripción no encontrada' });

    if (action === 'approve') {
      enrollment.approvalStatus = 'Aprobado';
      if (enrollment.stripePaymentMethodId) {
        // Cobrar con Stripe
        try {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: 5000, // Ejemplo: $50.00 en centavos
            currency: 'usd',
            payment_method: enrollment.stripePaymentMethodId,
            confirm: true,
            return_url: 'http://localhost:3000/success', // Para redireccionar después
          });
          enrollment.paymentStatus = 'Pagado';
        } catch (stripeErr) {
          console.error('Error cobrando con Stripe:', stripeErr);
          enrollment.paymentStatus = 'Error en pago';
          enrollment.professorComment += ' Error en procesamiento de pago.';
        }
      } else {
        enrollment.paymentStatus = 'Pagado'; // Para otros métodos
      }
    } else if (action === 'reject') {
      enrollment.approvalStatus = 'Rechazado';
      enrollment.paymentStatus = 'Rechazado';
    } else {
      return res.status(400).json({ error: 'Acción inválida' });
    }

    if (comment) enrollment.professorComment = comment;
    await enrollment.save();

    res.json(enrollment);
  } catch (err) {
    res.status(400).json({ error: 'Error actualizando aprobación', details: err.message });
  }
});

// Ruta para crear intención de pago con Stripe
app.post('/api/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body; // amount en centavos
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: 'Error creando intención de pago' });
  }
});

// Servir archivos estáticos de la interfaz (opcional, usando la raíz del proyecto)
const path = require('path');
app.use(express.static(path.join(__dirname, '..')));

// Soporte HTTPS si el usuario provee certificados
const SSL_KEY_PATH = process.env.SSL_KEY_PATH;
const SSL_CERT_PATH = process.env.SSL_CERT_PATH;

if (SSL_KEY_PATH && SSL_CERT_PATH && fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH)) {
  const sslOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH)
  };
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Servidor HTTPS corriendo en puerto ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Servidor HTTP corriendo en puerto ${PORT}`);
    console.log('Importante: para HTTPS configure SSL_KEY_PATH y SSL_CERT_PATH con rutas válidas');
  });
}