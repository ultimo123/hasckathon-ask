This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

1. **Database Setup**: Make sure you have PostgreSQL running and configured
2. **Environment Variables**: Create a `.env` file in the root directory

### AI Setup (Free Option - Groq)

This project uses the **Vercel AI SDK** with **Groq** (free tier available) for AI-powered employee matching.

#### Get a Free Groq API Key:

1. Visit [https://console.groq.com/keys](https://console.groq.com/keys)
2. Sign up for a free account (no credit card required)
3. Create an API key
4. Add it to your `.env` file:

```env
GROQ_API_KEY=your_groq_api_key_here
AI_PROVIDER=groq
GROQ_MODEL=llama-3.1-8b-instant

# If you encounter SSL certificate errors on Windows (development only):
# NODE_TLS_REJECT_UNAUTHORIZED=0
```

#### Available Groq Models (Free):

- `llama-3.1-8b-instant` (default) - Fast and efficient
- `llama-3.3-70b-versatile` - More powerful, better quality
- `mixtral-8x7b-32768` - Good for longer contexts
- `llama-3.1-70b-versatile` - ⚠️ Deprecated, use `llama-3.3-70b-versatile` instead

#### Alternative: Use OpenAI (Paid)

If you prefer OpenAI, set these in your `.env`:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
```

### Troubleshooting

#### SSL Certificate Errors (Windows)

If you see errors like "unable to get local issuer certificate":

**Quick Fix (Development Only):**

Option 1 - Use the insecure dev script:

```bash
npm run dev:insecure
```

Option 2 - Add to your `.env` file:

```env
NODE_TLS_REJECT_UNAUTHORIZED=0
```

⚠️ **Warning**: This disables SSL verification - ONLY use in development!

**Proper Solutions:**

1. Update Node.js to the latest version
2. Update Windows root certificates
3. Check if you're behind a corporate proxy/firewall
4. Install proper SSL certificates for your system

### Development

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
