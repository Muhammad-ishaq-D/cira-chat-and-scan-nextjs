import os

filepath = r"c:\Users\Admin\Desktop\INSTLY Technology\AskCira\v3\cira-chat-and-scan-nextjs\src\lib\react-router-compat.tsx"

new_content = """\"use client\";

import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Link({ to, children, ...props }: { to: string; children?: React.ReactNode; [key: string]: any }) {
  return <NextLink href={to} {...props}>{children}</NextLink>;
}

export function NavLink({ to, children, className, ...props }: { to: string; children?: React.ReactNode; className?: any; [key: string]: any }) {
  const pathname = usePathname();
  const isActive = pathname === to;
  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;
  return <NextLink href={to} className={computedClassName} {...props}>{children}</NextLink>;
}

export function useNavigate() {
  const router = useRouter();
  return (path: string | number, options?: { state?: any, replace?: boolean }) => {
    if (typeof path === 'number') {
      if (path === -1) router.back();
      return;
    }
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}

export function useLocation() {
  const pathname = usePathname();
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);

  return {
    pathname,
    search,
    hash: '',
    state: null,
  };
}

export function useParams() {
  return useNextParams();
}

export function useSearchParams() {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams());

  useEffect(() => {
    setSearchParams(new URLSearchParams(window.location.search));
  }, []);

  return [searchParams, () => {}] as const; // Dummy setter
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  return null;
}

export function Outlet() {
  return null; // Next.js uses children in layouts instead of Outlet
}
"""

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated react-router-compat.tsx")
