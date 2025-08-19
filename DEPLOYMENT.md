# Deployment Guide

This guide covers deploying the Engineering Project Management System to various platforms.

## Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase database setup completed
- [ ] Storage bucket created and configured
- [ ] Application tested locally
- [ ] Build process verified

## Vercel Deployment (Recommended)

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the `app` folder as the root directory

### 2. Configure Build Settings

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 3. Environment Variables

Add the following environment variables in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Deploy

Click "Deploy" and wait for the build to complete.

## Netlify Deployment

### 1. Site Configuration

Create a `netlify.toml` file in the app directory:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2. Environment Variables

Set environment variables in Netlify dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## AWS Amplify Deployment

### 1. Build Settings

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd app
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: app/.next
    files:
      - '**/*'
  cache:
    paths:
      - app/node_modules/**/*
```

### 2. Environment Variables

Add environment variables in AWS Amplify console.

## Docker Deployment

### 1. Dockerfile

Create a `Dockerfile` in the app directory:

```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### 2. Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
```

### 3. Build and Run

```bash
docker build -t epms .
docker run -p 3000:3000 epms
```

## Self-hosted Deployment

### 1. Server Requirements

- Node.js 18+
- PM2 or similar process manager
- Nginx (optional, for reverse proxy)
- SSL certificate

### 2. Build Application

```bash
cd app
npm install
npm run build
```

### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'epms',
    script: 'npm',
    args: 'start',
    cwd: './app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_SUPABASE_URL: 'your_supabase_url',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'your_supabase_anon_key'
    }
  }]
}
```

### 4. Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. Nginx Configuration (Optional)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment-specific Configurations

### Development

```env
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=your_dev_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_supabase_anon_key
```

### Staging

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_staging_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_supabase_anon_key
```

### Production

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_prod_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_supabase_anon_key
```

## Post-deployment Steps

### 1. Verify Functionality

- [ ] User registration and login
- [ ] Organization creation/joining
- [ ] Project creation and editing
- [ ] File uploads
- [ ] Database connections

### 2. Performance Optimization

- Enable compression (gzip/brotli)
- Configure CDN for static assets
- Set up monitoring and logging
- Configure error tracking (e.g., Sentry)

### 3. Security Considerations

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] File upload limits configured
- [ ] Rate limiting implemented

### 4. Monitoring Setup

Consider implementing:
- Application monitoring (New Relic, DataDog)
- Error tracking (Sentry, Bugsnag)
- Performance monitoring
- Uptime monitoring

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for environment variable issues

2. **Runtime Errors**
   - Verify Supabase connection
   - Check environment variables
   - Review server logs

3. **Performance Issues**
   - Enable Next.js image optimization
   - Configure proper caching headers
   - Optimize bundle size

### Getting Help

- Check deployment platform documentation
- Review application logs
- Test locally with production build
- Verify environment variables

## Maintenance

### Regular Tasks

- Monitor application performance
- Update dependencies regularly
- Backup database regularly
- Review and rotate API keys
- Monitor storage usage

### Updates

1. Test changes locally
2. Deploy to staging environment
3. Run integration tests
4. Deploy to production
5. Monitor for issues

## Scaling Considerations

### Horizontal Scaling

- Use load balancers
- Implement session sharing
- Configure database read replicas
- Use CDN for static assets

### Performance Optimization

- Implement caching strategies
- Optimize database queries
- Use connection pooling
- Monitor and optimize bundle size