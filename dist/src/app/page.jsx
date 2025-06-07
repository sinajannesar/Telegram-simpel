import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
export default function Page() {
    return (<div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 transition-colors duration-300">
      
      <div className="absolute right-8 top-4">
        <ThemeSwitcher />
      </div>

      <div className="text-center space-y-8 p-4">
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight md:text-7xl text-gray-900 dark:text-white ">
            Welcome to Telegram Mini
          </h1>
          <p className="max-w-xl text-lg md:text-xl text-gray-600 dark:text-gray-400">
            A new era of messaging. Fast, secure, and synced across all your devices.
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <Link href="../authregister/login" className="px-8 py-3 font-semibold rounded-full shadow-lg hover:scale-105 focus:outline-none focus:ring-4 transition-all duration-300 ease-in-out transform bg-blue-600 text-white shadow-blue-500/50 hover:bg-blue-700 focus:ring-blue-300 dark:bg-blue-500 dark:shadow-blue-500/30 dark:hover:bg-blue-600 dark:focus:ring-blue-400/50">
            Open Web Application
          </Link>
        </div>
      </div>
    </div>);
}
