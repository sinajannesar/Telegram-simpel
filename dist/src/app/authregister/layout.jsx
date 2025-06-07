import { ThemeSwitcher } from "@/components/theme-switcher";
export default function AuthLayout({ children }) {
    return (<div className="flex h-screen w-full items-center justify-center bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 transition-colors duration-300">
      
      <div className="absolute right-8 top-4">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md p-6">
        {children}
      </div>
      
    </div>);
}
