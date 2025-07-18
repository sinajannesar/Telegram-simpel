'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

const mockUsers = [
  {
    id: 1,
    email: "sinajannesar99@gmail.com",
    password: "123456",
    firstname: "sina",
    lastname: "jnnr",
    roomId: "room_1",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    email: "user2@example.com",
    password: "123456",
    firstname: "reza",
    lastname: "mohamad",
    roomId: "room_1",
    createdAt: "2024-01-02T00:00:00.000Z"
  }
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: email,
        password: password,
      });

      setIsLoading(false);

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("Incorrect email or password.");
        } else {
          setError(result.error);
        }
        return;
      }

      if (result?.ok && !result.error) {
        console.log('Login successful via NextAuth!');
        
        try {
          const userData = mockUsers.find(user => user.email === email);
          
          if (userData) {
            localStorage.setItem('user', JSON.stringify({
              id: userData.id,
              email: userData.email,
              firstname: userData.firstname,
              lastname: userData.lastname,
              roomId: userData.roomId || `room_${userData.id}`
            }));

            console.log('User data saved to localStorage:', {
              id: userData.id,
              email: userData.email,
              firstname: userData.firstname,
              lastname: userData.lastname,
              roomId: userData.roomId || `room_${userData.id}`
            });
          } else {
            console.error('User not found in mock data');
            setError("User data not found.");
            return;
          }
        } catch (err) {
          console.error('Error processing user data:', err);
          setError("Error processing user data.");
          return;
        }

        router.push('/chat');
        router.refresh();
      } else {
        setError("An error occurred during login. Please try again.");
      }

    } catch (err) {
      setIsLoading(false);
      console.error("Unexpected login error:", err);
      setError("An unexpected error occurred during login.");
    }
  };

  return (
    <div className="relative max-w-md w-full mx-auto bg-gradient-to-br from-white/10 to-gray-900/10 dark:from-gray-900/90 dark:to-black/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/30 dark:border-gray-700/50 transition-all duration-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]">
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/0 animate-pulse"></div>
      </div>

      <div className="text-center mb-10 relative z-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-950 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Welcome Back
        </h1>
        <p className="text-gray-500 dark:text-gray-300 mt-3 text-lg">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50"
          />
        </div>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50"
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center font-medium animate-pulse">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-8 py-3 font-semibold rounded-xl shadow-lg bg-gradient-to-r from-blue-800 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
          {isLoading ? (
            <Loader2 className="animate-spin h-6 w-6" />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-300 mt-8 relative z-10">
        Don&apos;t have an account?{' '}
        <Link
          href="/authregister/register"
          className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300 hover:underline"
        >
          Register Now
        </Link>
      </p>
    </div>
  );
}