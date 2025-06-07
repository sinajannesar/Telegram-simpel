'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
export function RegisterForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const handleChange = (e) => {
        setFormData(Object.assign(Object.assign({}, formData), { [e.target.name]: e.target.value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'An error occurred during registration');
            }
            const { token, user } = await res.json();
            console.log('Registration successful!', { token, user });
            router.push('/chat');
        }
        catch (_a) {
            setError("An error occurred during registration");
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="relative max-w-md w-full mx-auto bg-gradient-to-br from-white/10 to-gray-900/10 dark:from-gray-900/90 dark:to-black/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/30 dark:border-gray-700/50 transition-all duration-500 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]">
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
      </div>

      <div className="text-center mb-10 relative z-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Create an Account
        </h1>
        <p className="text-gray-500 dark:text-gray-300 mt-3 text-lg">
          Join us today!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div className="flex gap-4">
          <div className="relative w-1/2 group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"/>
            <input type="text" name="firstname" placeholder="First Name" onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50"/>
          </div>
          <div className="relative w-1/2 group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"/>
            <input type="text" name="lastname" placeholder="Last Name" onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50"/>
          </div>
        </div>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"/>
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50"/>
        </div>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300"/>
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/50"/>
        </div>

        {error && (<p className="text-red-500 text-sm text-center font-medium animate-pulse">
            {error}
          </p>)}

        <button type="submit" disabled={isLoading} className="w-full px-8 py-3 font-semibold rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-400/50 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group">
          <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
          {isLoading ? (<Loader2 className="animate-spin h-6 w-6"/>) : ('Register')}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-300 mt-8 relative z-10">
        Already have an account?{' '}
        <Link href="/authregister/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-300 hover:underline">
          Sign In
        </Link>
      </p>
    </div>);
}
