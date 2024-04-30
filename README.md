# Next.js Authentication Boilerplate

This project provides a robust boilerplate for building Next.js applications with integrated user authentication. Utilizing modern technologies such as TypeScript, Tailwind CSS, and Prisma ORM, this template is designed to kick-start development and streamline the process of implementing secure, efficient authentication.

## Features

- **Next.js 14**: The foundation of the boilerplate, providing server-side rendering and static generation capabilities.
- **TypeScript**: Ensures type safety across the application, enhancing development efficiency and reducing runtime errors.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development without leaving your HTML.
- **Prisma ORM**: Next-generation ORM for Node.js and TypeScript, simplifying database workflows with robust modeling and easy data access.
- **API Routes**: Leveraging Next.js API routes to handle authentication logic securely on the server side.
- **Environment-Sensitive Configuration**: Using `next.config.mjs`, `.env`, and `.env.local` for maintaining different settings across development, testing, and production environments.
- **Fully Responsive Layout**: Mobile-first layouts using Tailwind CSS, ensuring the application is accessible on any device.

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v14 or later)
- npm or yarn
- A supported SQL database (PostgreSQL, MySQL, etc.), if you plan to use Prisma for handling database operations.

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/jordanhughes421/nextjs-auth-boilerplate.git
   cd nextjs-auth-boilerplate
    ```
2. **Install Dependencies**
    Using npm:

    ```bash
    npm install
    ```

    Or using yarn:

    ```bash
    yarn
    ```
3. **Set Up Environment Variables**
Rename the .env.example to .env and update the variables to suit your environment:

    ```plaintext
    DATABASE_URL="your-database-url"
    SECRET="your-secret-key"
    ```

4. **Run Prisma Migrations (Optional)**
    If you are using Prisma, set up your database schema:
    ```bash
    npx prisma migrate dev
    ```

5. **Start the Development Server or Database**
    For Dev Server:
    ```bash

    npm run dev
    ```
    Or:

    ```bash

    yarn dev
    ```

    The application will be available at http://localhost:3000.

    For Prisma Database Server:
    ```bash

    npm run database
    ```
    Or:

    ```bash

    yarn database
    ```

    The application will be available at http://localhost:5555.

**Directory Structure**

    /app: Contains the core application features, including layout components and utility functions.
        /api: Server-side API routes for handling authentication.
        /dashboard: Components for the authenticated user's dashboard.
    /prisma: Contains Prisma schema files for database modeling.
    /public: Static files like images and the favicon.
    /utils: Shared utility functions across the application.
    /components: Shared component functions across the application.

**Customizing**

To customize this boilerplate for your own project:

*Modify the Prisma schema in /prisma/schema.prisma to reflect your database models.*
*Update the Tailwind configuration in tailwind.config.ts to match your design requirements.*
*Extend or modify API routes in /app/api to suit your authentication flow.*

**Contributing**

Contributions are welcome! Please fork the repository and submit pull requests with your features or fixes.

**License**

*Distributed under the MIT License. See LICENSE for more information.*