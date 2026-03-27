require('dotenv').config();
const mongoose = require('mongoose');

// Conectar a MongoDB
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
  role: String,
  createdAt: { type: Date, default: Date.now }
});

const CourseSchema = new mongoose.Schema({
  name: String,
  professorId: mongoose.Schema.Types.ObjectId,
  price: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  courseId: mongoose.Schema.Types.ObjectId,
  professorId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const QuestionnaireSchema = new mongoose.Schema({
  title: String,
  questions: Array,
  courseId: mongoose.Schema.Types.ObjectId,
  professorId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now }
});

const EnrollmentRequestSchema = new mongoose.Schema({
  studentId: mongoose.Schema.Types.ObjectId,
  courseId: mongoose.Schema.Types.ObjectId,
  status: { type: String, default: 'Pendiente' },
  comment: String,
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

const User = mongoose.model('User', UserSchema);
const Course = mongoose.model('Course', CourseSchema);
const Task = mongoose.model('Task', TaskSchema);
const Questionnaire = mongoose.model('Questionnaire', QuestionnaireSchema);
const EnrollmentRequest = mongoose.model('EnrollmentRequest', EnrollmentRequestSchema);
const Enrollment = mongoose.model('Enrollment', EnrollmentSchema);

const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🧪 Iniciando población de datos de prueba...');

    // Limpiar datos existentes
    await User.deleteMany({});
    await Course.deleteMany({});
    await Task.deleteMany({});
    await Questionnaire.deleteMany({});
    await EnrollmentRequest.deleteMany({});
    await Enrollment.deleteMany({});

    console.log('✅ Datos anteriores eliminados');

    // Crear usuarios de prueba
    const hashedPassword = await bcrypt.hash('123456', 10);

    const users = [
      {
        fullName: 'Profesor Juan Pérez',
        email: 'profesor@test.com',
        password: hashedPassword,
        role: 'profesor'
      },
      {
        fullName: 'Estudiante María García',
        email: 'estudiante1@test.com',
        password: hashedPassword,
        role: 'estudiante'
      },
      {
        fullName: 'Estudiante Carlos López',
        email: 'estudiante2@test.com',
        password: hashedPassword,
        role: 'estudiante'
      },
      {
        fullName: 'Estudiante Ana Rodríguez',
        email: 'estudiante3@test.com',
        password: hashedPassword,
        role: 'estudiante'
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('✅ Usuarios creados:', createdUsers.length);

    // Obtener IDs
    const profesor = createdUsers.find(u => u.role === 'profesor');
    const estudiantes = createdUsers.filter(u => u.role === 'estudiante');

    // Crear cursos de prueba
    const courses = [
      {
        name: 'Introducción a la Programación con Python',
        professorId: profesor._id,
        price: 0
      },
      {
        name: 'Desarrollo Web con HTML, CSS y JavaScript',
        professorId: profesor._id,
        price: 25
      },
      {
        name: 'Bases de Datos con MySQL',
        professorId: profesor._id,
        price: 20
      },
      {
        name: 'Algoritmos y Estructuras de Datos',
        professorId: profesor._id,
        price: 30
      }
    ];

    const createdCourses = await Course.insertMany(courses);
    console.log('✅ Cursos creados:', createdCourses.length);

    // Crear tareas para cada curso
    const tasks = [];
    createdCourses.forEach(course => {
      tasks.push({
        title: `Tarea 1 - ${course.name}`,
        description: 'Completa los ejercicios básicos del módulo 1.',
        courseId: course._id,
        professorId: profesor._id
      });
      tasks.push({
        title: `Tarea 2 - ${course.name}`,
        description: 'Proyecto práctico del módulo 2.',
        courseId: course._id,
        professorId: profesor._id
      });
    });

    await Task.insertMany(tasks);
    console.log('✅ Tareas creadas:', tasks.length);

    // Crear cuestionarios
    const questionnaires = [];
    createdCourses.forEach(course => {
      questionnaires.push({
        title: `Cuestionario Final - ${course.name}`,
        questions: [
          {
            question: '¿Cuál es el concepto principal del curso?',
            options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
            correctAnswer: 0
          },
          {
            question: '¿Qué herramienta se utiliza principalmente?',
            options: ['Herramienta 1', 'Herramienta 2', 'Herramienta 3', 'Herramienta 4'],
            correctAnswer: 1
          }
        ],
        courseId: course._id,
        professorId: profesor._id
      });
    });

    await Questionnaire.insertMany(questionnaires);
    console.log('✅ Cuestionarios creados:', questionnaires.length);

    // Crear algunas solicitudes de inscripción
    const enrollmentRequests = [
      {
        studentId: estudiantes[0]._id,
        courseId: createdCourses[0]._id,
        status: 'Aprobado'
      },
      {
        studentId: estudiantes[1]._id,
        courseId: createdCourses[1]._id,
        status: 'Pendiente'
      },
      {
        studentId: estudiantes[2]._id,
        courseId: createdCourses[0]._id,
        status: 'Aprobado'
      }
    ];

    await EnrollmentRequest.insertMany(enrollmentRequests);
    console.log('✅ Solicitudes de inscripción creadas:', enrollmentRequests.length);

    // Crear inscripciones aprobadas
    const enrollments = [
      {
        studentId: estudiantes[0]._id,
        courseId: createdCourses[0]._id,
        paymentMethod: 'Gratis',
        paymentStatus: 'Pagado',
        approvalStatus: 'Aprobado'
      },
      {
        studentId: estudiantes[2]._id,
        courseId: createdCourses[0]._id,
        paymentMethod: 'Tarjeta',
        paymentStatus: 'Pagado',
        approvalStatus: 'Aprobado'
      }
    ];

    await Enrollment.insertMany(enrollments);
    console.log('✅ Inscripciones creadas:', enrollments.length);

    console.log('\n🎉 ¡Datos de prueba poblados exitosamente!');
    console.log('\n📋 Credenciales de prueba:');
    console.log('Profesor: profesor@test.com / 123456');
    console.log('Estudiantes: estudiante1@test.com, estudiante2@test.com, estudiante3@test.com / 123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error poblando datos:', error);
    process.exit(1);
  }
}

seedDatabase();