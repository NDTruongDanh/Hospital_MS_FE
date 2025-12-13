# Hospital Management System (HMS) - Frontend

A comprehensive web application for managing hospital operations, built with Next.js, React, and TypeScript.

## 📖 Documentation

**👉 [Read the Complete Project Guide](./PROJECT_GUIDE.md)** - Comprehensive documentation covering setup, architecture, development workflow, and more.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20+)
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm format       # Format code with Prettier
```

## 🎯 Project Overview

**HMS (Hospital Management System)** is a role-based application for managing hospital operations:

- **Patient Management** - Registration, profiles, medical history
- **Appointment Scheduling** - Booking, rescheduling, cancellation
- **Medical Examinations** - Exam records, prescriptions
- **Billing & Invoicing** - Payment processing
- **Human Resources** - Employee, department, schedule management
- **Medicine Inventory** - Stock management
- **Reports & Analytics** - Statistical reports

### User Roles

- **ADMIN** - Full system access
- **DOCTOR** - Medical operations (appointments, examinations, prescriptions)
- **NURSE** - Clinical support (view records)
- **RECEPTIONIST** - Front desk (patient registration, appointment booking)
- **PATIENT** - Self-service portal

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Testing**: Playwright

## 📚 Additional Resources

- **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)** - Complete project documentation
- **[DOCS/](./DOCS/)** - Detailed documentation and specifications
- **[DOCS/TEST_ACCOUNTS.md](./DOCS/TEST_ACCOUNTS.md)** - Test account credentials
- **[DOCS/CONTRIBUTING.md](./DOCS/CONTRIBUTING.md)** - Contribution guidelines

## 🔗 External Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

For detailed information, please refer to the [PROJECT_GUIDE.md](./PROJECT_GUIDE.md).
