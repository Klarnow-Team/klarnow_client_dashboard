# Klarnow Client Dashboard

A guided onboarding and project tracking system for Klarnow clients. Helps clients submit information for their Launch Kit (3-page site) or Growth Kit (4-6 page funnel with emails) over 14 days.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MySQL (via Prisma ORM)
- **Styling:** Tailwind CSS
- **Deployment:** Railway

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MySQL database (see PRISMA_SETUP.md)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```env
DATABASE_URL="mysql://user:password@host:port/database"
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Root page (redirects)
│   ├── layout.tsx              # Root layout
│   ├── login/                  # Client login
│   ├── home/                   # Home tab - project status
│   ├── launch-kit/             # Launch Kit tab
│   │   ├── onboarding/         # Onboarding wizard
│   │   └── build-tracker/      # Build tracker view
│   └── growth-kit/             # Growth Kit tab
│       ├── onboarding/
│       └── build-tracker/
├── components/
│   ├── ui/                     # UI components
│   ├── onboarding/             # Onboarding components
│   └── tracker/                # Build tracker components
├── utils/
│   └── auth.ts                 # Authentication utilities
├── types/
│   └── project.ts              # TypeScript type definitions
├── lib/
│   ├── prisma.ts               # Prisma client
│   └── utils.ts                # Utility functions
└── hooks/                      # React hooks
```

## Documentation

- `DEV_UX_SUMMARY.md` - Comprehensive technical specifications
- `KLARNOW_DASHBOARD_REQUIREMENTS.md` - Requirements and specifications

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
