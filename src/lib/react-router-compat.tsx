"use client";

import React, { useState, useEffect } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useParams as useNextParams } from 'next/navigation';

export const Link = React.forwardRef<HTMLAnchorElement, { to: string; children?: React.ReactNode; [key: string]: any }>(({ to, children, ...props }, ref) => {
  return <NextLink href={to} ref={ref} {...props}>{children}</NextLink>;
});
Link.displayName = "Link";

export const NavLink = React.forwardRef<HTMLAnchorElement, { to: string; children?: React.ReactNode; className?: any; [key: string]: any }>(({ to, children, className, ...props }, ref) => {
  const pathname = usePathname();
  const isActive = pathname === to;
  const computedClassName = typeof className === 'function' ? className({ isActive }) : className;
  return <NextLink href={to} ref={ref} className={computedClassName} {...props}>{children}</NextLink>;
});
NavLink.displayName = "NavLink";

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
