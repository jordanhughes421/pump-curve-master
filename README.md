# Pump Performance Curve Manager

A modern web application for managing and visualizing pump performance curves. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- View and manage pump specifications
- Interactive performance curve visualization
- Add, edit, and delete pump curves
- Responsive design for all screen sizes
- Modern, clean user interface

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: Prisma with PostgreSQL

## Getting Started

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd pump-curve-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your database configuration.

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## License

MIT License - feel free to use this code for your own projects.