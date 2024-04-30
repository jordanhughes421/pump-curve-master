'use client'
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'



const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const [error, setError] = useState<string>(''); // Explicitly type the error state as string
    const router = useRouter();
    const onDashboard = pathname.startsWith('/dashboard') &&
                    !pathname.startsWith('/dashboard/login') &&
                    !pathname.startsWith('/dashboard/register');

    const handleLogout = async () => {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
    
          const data = await response.json();
          if (response.ok) {
            router.push('/');
          } else {
            throw new Error(data.message || 'Failed to check session');
          }
        } catch (error: unknown) {
          // Check if the error is an instance of Error and set the message, else set a default error message
          if (error instanceof Error) {
            setError(error.message);
          } else {
            setError('An unexpected error occurred');
          }
        }
      };

    const homeLink = onDashboard ? '/dashboard' : '/';
    
    const navLinks = [
        { href: homeLink, label: 'Home' },
    ];

    if (!onDashboard) {
        navLinks.push({ href: '/dashboard/login', label: 'Login' });
        navLinks.push({ href: '/dashboard/register', label: 'Register' });
    } 

    return (
        <header className="md:flex bg-brandColor1">  {/* Use brandColor1 for background */}
            <div className="container mx-auto flex justify-between items-center bg-brandColor1 text-brandColor5 p-4">
                <h1 className="text-lg text-brandColor4 font-bold">Next.js Boilerplate</h1>
                <button className="text-brandColor4 md:hidden" onClick={() => setIsOpen(!isOpen)}>
                    <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                </button>
            </div>
            <nav className={`md:flex md:items-center md:justify-end text-brandColor5 p-4 mr-2 sm:mr-8 ${isOpen ? '' : 'hidden'}`}>
                <ul className="flex flex-col md:flex-row gap-4 items-end shrink">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link href={link.href} className="hover:text-brandColor3" onClick={() => setIsOpen(false)}>
                                {link.label}
                            </Link>
                        </li>
                    ))}
                    {onDashboard && (
                        <li>
                            <button onClick={handleLogout} className="hover:text-brandColor3">Logout</button>
                        </li>
                    )}
                </ul>
            </nav>
        </header>
    );
};

export default Header;

