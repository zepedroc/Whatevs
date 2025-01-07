'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

import {
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from '@/components/ui/navigation-menu';
import { ChatMode } from '@/constants/chatbot-constants';
import { cn } from '@/lib/utils';
import { MountainIcon } from '@/icons/icons';
import { LanguageSwitcher } from './language-switcher';

export default function NavBar() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const chatModes = [
    {
      title: t('chatModes.aiAssistant.title'),
      href: `/${locale}/chatbot`,
      description: t('chatModes.aiAssistant.description'),
    },
    {
      title: t('chatModes.psychologist.title'),
      href: `/${locale}/chatbot?mode=${ChatMode.Psychologist}`,
      description: t('chatModes.psychologist.description'),
    },
    {
      title: t('chatModes.grok.title'),
      href: `/${locale}/chatbot?mode=${ChatMode.Grok}`,
      description: t('chatModes.grok.description'),
    },
    {
      title: t('chatModes.instructor.title'),
      href: `/${locale}/chatbot?mode=${ChatMode.Instructor}`,
      description: t('chatModes.instructor.description'),
    },
  ];

  return (
    <header className="flex h-16 w-full items-center justify-between px-4 md:px-6">
      <nav className="flex items-center gap-6">
        <Link className="flex items-center gap-2 text-lg font-semibold" href={`/${locale}`}>
          <MountainIcon className="h-6 w-6" />
          <span className="sr-only">Whatevs</span>
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuLink asChild>
              <Link
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
                href={`/${locale}`}
              >
                {t('navigation.home')}
              </Link>
            </NavigationMenuLink>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t('navigation.chatbot')}</NavigationMenuTrigger>
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
                href={`/${locale}/images`}
              >
                {t('navigation.images')}
              </Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
                href={`/${locale}/world-clocks`}
              >
                {t('navigation.worldClocks')}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
      <LanguageSwitcher />
    </header>
  );
}

const ListItem = React.forwardRef<React.ComponentRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
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
