'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/upload', label: 'Translate' },
  { href: '/documents', label: 'Documents' },
  { href: '/debug', label: 'Debug' },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-ink-900 border-b border-parchment-300/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-parchment-200 font-serif text-xl font-bold tracking-wide">
              Scriptoria
            </span>
            <span className="text-parchment-400 text-xs font-light hidden sm:block">
              Old French Document Translator
            </span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-parchment-300/20 text-parchment-100'
                      : 'text-parchment-300 hover:text-parchment-100 hover:bg-parchment-300/10'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
