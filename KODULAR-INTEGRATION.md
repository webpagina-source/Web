# Integración con Kodular

Tu plataforma Cursos Virtual es completamente compatible con Kodular. Puedes crear apps móviles nativas en Kodular que se conecten al backend usando las APIs REST.

## 🚀 APIs Disponibles para Kodular

### Autenticación

- **POST** `/api/login`
  - Body: `{"email": "user@example.com", "password": "pass", "expectedRole": "estudiante"}`
  - Respuesta: `{"token": "jwt_token", "user": {...}}`

- **POST** `/api/register`
  - Body: `{"fullName": "Nombre", "email": "user@example.com", "password": "pass", "role": "estudiante"}`

### Datos (requieren token en header `Authorization: Bearer <token>`)

- **GET** `/api/courses` - Lista cursos
- **POST** `/api/courses` - Crear curso (profesores)
- **GET** `/api/tasks` - Lista tareas
- **POST** `/api/tasks` - Crear tarea
- **GET** `/api/students` - Lista estudiantes
- **GET** `/api/questionnaires` - Lista cuestionarios
- **POST** `/api/questionnaires` - Crear cuestionario

## 📱 Cómo conectar en Kodular

### 1. Configurar Web component

- Agrega "Web" component a tu proyecto Kodular
- URL base: `https://tu-servidor.com/api` (cambia por tu URL desplegada)

### 2. Login en Kodular

```
Cuando ButtonLogin.Click
  Web1.Url ← "https://tu-servidor.com/api/login"
  Web1.RequestHeaders ← "Content-Type: application/json"
  Web1.PostText ← "{\"email\": \"" + TextBoxEmail.Text + "\", \"password\": \"" + TextBoxPassword.Text + "\", \"expectedRole\": \"estudiante\"}"
  Web1.PostText
```

### 3. Manejar respuesta

```
Cuando Web1.GotText
  Si Web1.ResponseCode = 200 entonces
    // Parsear JSON y guardar token
    almacenar token en TinyDB
    navegar a pantalla principal
  sino
    mostrar error
```

### 4. Requests autenticados

```
Cuando necesites datos:
  Web1.Url ← "https://tu-servidor.com/api/courses"
  Web1.RequestHeaders ← "Authorization: Bearer " + obtener token de TinyDB
  Web1.Get
```

## 🔐 Seguridad

- Usa HTTPS en producción
- Almacena tokens de forma segura (TinyDB)
- Valida respuestas antes de usar datos

## 📋 Ejemplo completo

Crea una app Kodular que:

1. Permita login/registro
2. Muestre lista de cursos
3. Permita ver tareas y cuestionarios
4. Funcione offline con localStorage equivalente

¡La integración es sencilla ya que las APIs son RESTful con JSON!
