# StyreIQ - Governance & Compliance Platform

StyreIQ is a comprehensive governance and compliance platform designed to help organizations manage social media accounts, track policy compliance, and monitor risks across distributed teams.

## �� Features

- **Governance & Ownership**: Track every account and connected user with ownership logs
- **Compliance & Policy**: Upload institution-specific policies with acknowledgment tracking
- **Risk & Response**: Flag potential risks like unassigned accounts and inactive admins
- **Dashboard Analytics**: Centralized visibility and complete account registry
- **Multi-tenant Support**: Department-level oversight with organization hierarchy

## ��️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Payload CMS 3.33
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS 4, Radix UI
- **Authentication**: Payload Auth
- **Email**: Resend
- **Deployment**: Docker, Vercel

## �� Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (^18.20.2 || >=20.9.0)
- [Yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

## �� Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd StyreIQ
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Required Environment Variables
PAYLOAD_SECRET=your-payload-secret-here
POSTGRES_URL=postgres://postgres:postgres@127.0.0.1:5432/web-payload
NEXT_PUBLIC_BASE_URL=http://localhost:3000
FROM_ADDRESS=noreply@yourdomain.com
FROM_NAME='Your Organization Name'
NEXT_PUBLIC_NODE_ENV=development
RESEND_API_KEY=your-resend-api-key
LOCAL_EMAIL_TO_ADDRESS=your-email@domain.com
SMTP_HOST=smtp-relay.brevo.com
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
NODE_ENV=development
```

### 3. Start the Database

```bash
docker compose up -d
```

This will start a PostgreSQL database on port 5432.

### 4. Install Dependencies

```bash
yarn install
```

### 5. Run Database Migrations

```bash
yarn run payload migrate
```

### 6. Start the Development Server

```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

## �� Development

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn type-check` - Run TypeScript type checking
- `yarn payload migrate` - Run database migrations
- `yarn payload migrate:create` - Create new migration

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── (landing)/         # Landing page
│   └── (payload)/         # Payload CMS admin
├── features/              # Feature modules
│   ├── audit-log/         # Audit logging
│   ├── auth/              # Authentication
│   ├── dashboard/         # Dashboard components
│   ├── flags/             # Risk flagging
│   ├── organizations/     # Organization management
│   ├── policies/          # Policy management
│   ├── social-medias/     # Social media management
│   └── users/             # User management
├── shared/                # Shared components and utilities
└── types/                 # TypeScript types
```

## �� Docker

### Development with Docker

The project includes a `docker-compose.yml` file for easy local development:

```bash
# Start PostgreSQL database
docker compose up -d

# Install dependencies and start development server
yarn install
yarn dev
```

### Production Docker

To build and run the application in production:

```bash
# Build the Docker image
docker build -t styreiq .

# Run the container
docker run -p 3000:3000 --env-file .env styreiq
```

## �� Environment Variables

### Required Variables

| Variable                 | Description                    | Example                                                   |
| ------------------------ | ------------------------------ | --------------------------------------------------------- |
| `PAYLOAD_SECRET`         | Secret key for Payload CMS     | `xxxxxxxxxxxxxxxxx`                                       |
| `POSTGRES_URL`           | PostgreSQL connection string   | `postgres://postgres:postgres@127.0.0.1:5432/web-payload` |
| `NEXT_PUBLIC_BASE_URL`   | Public URL for the application | `http://localhost:3000`                                   |
| `FROM_ADDRESS`           | Email sender address           | `noreply@yourdomain.com`                                  |
| `FROM_NAME`              | Email sender name              | `'Your Organization Name'`                                |
| `NEXT_PUBLIC_NODE_ENV`   | Environment mode               | `development`                                             |
| `RESEND_API_KEY`         | Resend API key for email       | `re_your-api-key-here`                                    |
| `LOCAL_EMAIL_TO_ADDRESS` | Local email recipient          | `your-email@domain.com`                                   |
| `SMTP_HOST`              | SMTP server host               | `smtp-relay.brevo.com`                                    |
| `SMTP_USER`              | SMTP username                  | `your-smtp-user`                                          |
| `SMTP_PASS`              | SMTP password                  | `your-smtp-password`                                      |
| `NODE_ENV`               | Node environment               | `development`                                             |

## �� Database

The application uses PostgreSQL as the primary database. The database schema is managed through Payload CMS migrations.

### Running Migrations

```bash
# Run all pending migrations
yarn run payload migrate

# Create a new migration
yarn run payload migrate:create
```

## �� Testing

```bash
# Run type checking
yarn type-check

# Run linting
yarn lint

# Run all checks
yarn ci:checks
```

## �� Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application: `yarn build`
2. Start the production server: `yarn start`

## �� Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## �� License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## �� Support

If you encounter any issues or have questions:

1. Check the [documentation](https://payloadcms.com/docs)
2. Search existing [GitHub issues](https://github.com/payloadcms/payload/issues)
3. Create a new issue with detailed information

## �� Version History

- **v1.0.11** - Initial release with core governance features
- **v1.0.0** - Base template with authentication and basic CMS functionality
