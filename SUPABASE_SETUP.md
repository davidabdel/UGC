# Supabase Authentication Setup

This project uses Supabase for authentication. Follow these steps to set up your Supabase project and connect it to this application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project
3. Choose a name and password for your project
4. Wait for the project to be created

## 2. Configure Authentication

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable Email provider and configure as needed
3. If you want to use Google authentication:
   - Enable Google provider
   - Follow the instructions to set up OAuth with Google
   - Add your application's URL to the authorized redirect URLs

## 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase dashboard under **Settings** > **API**.

## 4. Configure Email Templates (Optional)

If you want to customize the email templates for confirmation emails, password resets, etc.:

1. Go to **Authentication** > **Email Templates**
2. Customize the templates as needed

## 5. Testing Authentication

Once you've set up Supabase and added your environment variables, you can test the authentication flow:

1. Register a new user
2. Confirm the email (check your inbox)
3. Log in with the registered credentials

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js with Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
