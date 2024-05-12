'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import React, { JSX, SVGProps } from 'react';

import {
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from '@/components/ui/navigation-menu';
import { Toggle } from '@/components/ui/toggle';
import { ChatMode } from '@/src/app/chatbot/constants';
import { cn } from '@/lib/utils';
import { MoonIcon, MountainIcon } from '@/src/app/icons/icons';

const chatModes = [
  { title: 'AI Assistant', href: `/chatbot`, description: 'Start fresh with a new chat.' },
  { title: 'Elon Musk', href: `/chatbot?mode=${ChatMode.Elon_Musk}`, description: 'Talk to Elon Musk.' },
  { title: 'Psychologist', href: `/chatbot?mode=${ChatMode.Psychologist}`, description: 'Talk to a psychologist.' },
  { title: 'Grok', href: `/chatbot?mode=${ChatMode.Grok}`, description: 'A witty and irreverent AI assistant.' },
];

export default function NavBar() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="flex h-16 w-full items-center justify-between px-4 md:px-6">
      <nav className="flex items-center gap-6">
        <Link className="flex items-center gap-2 text-lg font-semibold" href="/">
          <MountainIcon className="h-6 w-6" />
          <span className="sr-only">Whatevs</span>
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuLink asChild>
              <Link
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
                href="/"
              >
                Home
              </Link>
            </NavigationMenuLink>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Chatbot</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  {chatModes.map((mode) => (
                    <ListItem key={mode.title} title={mode.title} href={mode.href}>
                      {mode.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
                href="/images"
              >
                Images
              </Link>
            </NavigationMenuLink>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
      <Toggle
        aria-label="Toggle dark mode"
        className="rounded-full p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:hover:bg-gray-800"
        onPressedChange={toggleDarkMode}
      >
        <MoonIcon className="h-5 w-5" />
      </Toggle>
    </header>
  );
}

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  },
);
ListItem.displayName = 'ListItem';
