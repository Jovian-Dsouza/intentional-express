# Originals Express Backend

A modern Express.js backend server built with TypeScript, PostgreSQL, and Prisma ORM.

## 🚀 Features

- **Express.js** - Fast, minimalist web framework
- **TypeScript** - Type-safe development
- **Prisma** - Next-generation ORM for Node.js
- **PostgreSQL** - Powerful, open-source database
- **Docker Compose** - Easy development and testing setup
- **Zod** - Schema validation
- **Jest** - Testing framework
- **Security** - Helmet and CORS enabled

## 📋 Prerequisites

- Node.js 20.x or higher
- Docker and Docker Compose
- npm or yarn

## 🛠️ Setup

1. **Clone the repository**
   ```bash
   cd /Users/jovian/Developer/base/originals/originals-express
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start PostgreSQL with Docker**
   ```bash
   npm run docker:up
   ```

5. **Run Prisma migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

7. **Seed the database (optional)**
   ```bash
   npm run prisma:seed
   ```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## 🧪 Testing

### Run tests with Docker Compose
```bash
npm run docker:test
```

### Run tests locally
```bash
npm test
```

### Watch mode
```bash
npm run test:watch
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create a new user
- `PATCH /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create a new post
- `PATCH /api/posts/:id` - Update a post
- `DELETE /api/posts/:id` - Delete a post

## 📁 Project Structure

```
originals-express/
├── src/
│   ├── __tests__/         # Test files
│   ├── lib/               # Utilities and libraries
│   │   └── prisma.ts      # Prisma client instance
│   ├── middleware/        # Express middleware
│   │   └── errorHandler.ts
│   ├── routes/            # API routes
│   │   ├── users.ts
│   │   └── posts.ts
│   ├── app.ts             # Express app configuration
│   └── index.ts           # Application entry point
├── prisma/
│   ├── schema.prisma      # Prisma schema
│   └── seed.ts            # Database seeding
├── docker-compose.yml     # Docker Compose for development
├── docker-compose.test.yml # Docker Compose for testing
├── Dockerfile             # Production Dockerfile
├── Dockerfile.test        # Test Dockerfile
├── tsconfig.json          # TypeScript configuration
├── jest.config.js         # Jest configuration
└── package.json           # Dependencies and scripts
```

## 🐳 Docker Commands

### Development Database
```bash
# Start PostgreSQL
npm run docker:up

# Stop PostgreSQL
npm run docker:down
```

### Testing
```bash
# Run tests in Docker
npm run docker:test
```

## 🗄️ Database Management

### Prisma Studio
Access the database GUI:
```bash
npm run prisma:studio
```

### Migrations
```bash
# Create a new migration
npm run prisma:migrate

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

## 📝 Example Requests

### Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

### Create a Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Post",
    "content": "This is the content",
    "published": true,
    "authorId": "USER_ID_HERE"
  }'
```

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DATABASE_URL` | PostgreSQL connection string | See .env.example |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

ISC
