# Engineering Project Management System

A comprehensive project management system built with Next.js and Supabase, designed specifically for engineering projects with equipment tracking, document management, and progress monitoring.

## Features

- **Project Management**: Create, edit, and track engineering projects
- **Equipment Tracking**: Manage project equipment with detailed specifications
- **Document Management**: Upload and organize project documents
- **Progress Monitoring**: Track project phases and progress updates
- **Organization Management**: Multi-organization support with role-based access
- **Client View**: Dedicated client portal for project visibility
- **File Upload**: Support for various document types and Excel import
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 15.4.6, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Excel Processing**: SheetJS (xlsx)

## Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account and project

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Engineering-Project-Management-System/app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the `app` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase project credentials:
- Get your project URL and anon key from your Supabase dashboard
- Go to Settings → API in your Supabase project

### 4. Database Setup

Create the following tables in your Supabase database:

#### Organizations Table
```sql
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  location TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Organization Members Table
```sql
CREATE TABLE organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  po_number TEXT,
  client_name TEXT,
  location TEXT,
  industry TEXT,
  sales_order_date DATE,
  project_value DECIMAL,
  payment_terms TEXT,
  payment_schedule TEXT,
  kickoff_notes TEXT,
  production_notes TEXT,
  scope JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Equipment Table
```sql
CREATE TABLE equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  specifications JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  manufacturing_serial TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Project Progress Table
```sql
CREATE TABLE project_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  remarks TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, phase_name)
);
```

#### Project Documents Table
```sql
CREATE TABLE project_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  doc_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Equipment Documents Table
```sql
CREATE TABLE equipment_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  doc_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Storage Setup

In your Supabase dashboard:
1. Go to Storage
2. Create a bucket called `project-files`
3. Set appropriate policies for file access

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### First Time Setup

1. **Sign Up**: Create a new account on the sign-up page
2. **Organization Setup**: Create a new organization or join an existing one
3. **Dashboard Access**: Once set up, you'll have access to the main dashboard

### Creating Projects

1. Click "Add Project" on the dashboard
2. Fill in project details (title, PO number, client, etc.)
3. Add equipment specifications
4. Upload relevant documents
5. Save the project

### Managing Projects

- **View Details**: Click on any project card to view full details
- **Edit Projects**: Use the edit button to modify project information
- **Track Progress**: Update progress for different project phases
- **Client View**: Generate client-friendly project views

### Equipment Management

- Add equipment during project creation
- Specify quantities and technical details
- Upload equipment-specific documents
- Track equipment status and serial numbers

### Document Management

- Upload project documents (PDFs, images, etc.)
- Organize documents by type
- Access documents from project details

## Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboard/    # Main dashboard
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   └── lib/             # Utilities and configurations
├── public/              # Static assets
└── package.json         # Dependencies
```

## Key Components

- **Dashboard**: Main project overview and management
- **AddProjectModal**: Project creation interface
- **ProjectEditModal**: Project editing interface
- **ProjectDetailModal**: Detailed project view
- **ClientViewModal**: Client-facing project view
- **OrganizationSetup**: Organization management
- **ErrorBoundary**: Error handling wrapper

## API Endpoints

- `/api/projects` - Project CRUD operations
- `/api/equipment` - Equipment management
- `/api/organizations` - Organization management
- `/api/project-documents` - Document upload
- `/api/project-progress` - Progress tracking
- `/api/auth/set` - Session management
- `/api/auth/signout` - User logout

## Development

### Running Tests

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm run start
```

## Deployment

The application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **AWS Amplify**
- **Docker containers**

### Environment Variables for Production

Ensure all environment variables are properly set in your deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Supabase Connection**: Verify your environment variables
2. **Database Errors**: Ensure all tables are created properly
3. **File Upload Issues**: Check Supabase storage bucket configuration
4. **Authentication Problems**: Verify Supabase auth settings

### Getting Help

- Check the browser console for error messages
- Verify network requests in developer tools
- Review Supabase dashboard for database/auth issues

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please create an issue in the repository or contact the development team.