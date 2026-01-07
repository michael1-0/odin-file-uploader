# odin-file-uploader

This is a project submission for The Odin Project NodeJS Course, Project: File Uploader.

This is a full-stack file management application built with Node.js, Express, and PostgreSQL. Users can organize their files in folders, upload images to Cloudinary, and manage their personal file storage.


## Features

- **User Authentication** - Secure sign up and login with bcrypt password hashing
- **Folder Management** - Create nested folders to organize files
- **File Upload** - Upload images (JPEG, PNG, GIF) up to 10MB
- **Cloud Storage** - Files stored securely on Cloudinary
- **File Operations** - View, download, and delete files
- **Breadcrumb Navigation** - Easy navigation through folder hierarchy

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Passport.js with Local Strategy
- **Session Storage**: express-session with Prisma Session Store
- **File Upload**: Multer in-memory
- **Cloud Storage**: Cloudinary
- **Template Engine**: EJS
- **Validation**: express-validator

## Installation

Install dependencies:
```bash
npm install
```

Set up environment variables by creating a `.env` file:
```env
cp .env.example .env
```

Run database migrations:
```bash
npx prisma migrate deploy
```

Generate Prisma client:
```bash
npx prisma generate
```

Run the development server:
```bash
npm run dev
```

## API Routes

### Authentication
- `GET /sign-up` - Sign up form
- `POST /sign-up` - Create new user
- `GET /log-in` - Login form
- `POST /log-in` - Authenticate user
- `GET /log-out` - Logout user

### Folders
- `GET /` - Home page (root folders)
- `GET /folders/new` - Create folder form
- `POST /folders` - Create root folder
- `GET /folders/:id` - View folder contents
- `GET /folders/:id/new` - Create subfolder form
- `POST /folders/:id` - Create subfolder
- `GET /folders/:id/update` - Update folder form
- `POST /folders/:id/update` - Update folder name
- `GET /folders/:id/del` - Delete folder

### Files
- `GET /files/new` - Upload file form
- `POST /files` - Upload file
- `GET /files/:id` - View file details
- `GET /files/:id/del` - Delete file