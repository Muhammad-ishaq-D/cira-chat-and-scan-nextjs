"use client";

import NextLink from 'next/link';
import { useRouter, usePathname, useSearchParams as useNextSearchParams, useParams as useNextParams } from 'next/navigation';

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
  const searchParams = useNextSearchParams();
  return {
    pathname,
    search: searchParams ? `?${searchParams.toString()}` : '',
    hash: '',
    state: null,
  };
}

export function useParams() {
  return useNextParams();
}

export function useSearchParams() {
  const searchParams = useNextSearchParams();
  return [searchParams, () => {}] as const; // Dummy setter
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useRouter();
  if (typeof window !== 'undefined') {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }
  return null;
}

export function Outlet() {
  return null; // Next.js uses children in layouts instead of Outlet
}
