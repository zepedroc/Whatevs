'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

import { NavigationMenuLink, NavigationMenuList, NavigationMenu } from '@/components/ui/navigation-menu';
import { LanguageSwitcher } from './language-switcher';

export default function NavBar() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [lineStyle, setLineStyle] = useState({
    width: 0,
    left: 0,
    opacity: 0,
    transition: 'all 300ms ease-out',
  });

  const itemRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hoveredItem && itemRefs.current[hoveredItem]) {
      const element = itemRefs.current[hoveredItem];
      const rect = element?.getBoundingClientRect();
      const parentRect = element?.parentElement?.getBoundingClientRect();

      if (rect && parentRect) {
        setLineStyle({
          width: rect.width,
          left: rect.left - parentRect.left,
          opacity: 1,
          transition: 'all 300ms ease-out',
        });
      }
    } else {
      setLineStyle({
        width: 0,
        left: 0,
        opacity: 0,
        transition: 'none',
      });
    }
  }, [hoveredItem]);

  const navItems = [
    { key: 'home', href: `/${locale}`, label: t('navigation.home') },
    { key: 'chatbot', href: `/${locale}/chatbot`, label: t('navigation.chatbot') },
    { key: 'images', href: `/${locale}/images`, label: t('navigation.images') },
    { key: 'worldClocks', href: `/${locale}/world-clocks`, label: t('navigation.worldClocks') },
    { key: 'worldMap', href: `/${locale}/world-map`, label: t('navigation.worldMap') },
    { key: 'games', href: `/${locale}/games`, label: t('navigation.games') },
  ];

  return (
    <header className="flex h-16 w-full items-center justify-between px-4 md:px-6">
      <nav
        className="flex items-center gap-6"
        ref={navRef}
        onMouseLeave={() => {
          setHoveredItem(null);
        }}
      >
        <NavigationMenu>
          <NavigationMenuList className="relative">
            {/* Sliding underline effect */}
            <div
              className="absolute h-0.5 bg-black pointer-events-none dark:bg-white"
              style={{
                width: `${lineStyle.width}px`,
                left: `${lineStyle.left}px`,
                opacity: lineStyle.opacity,
                bottom: '-2px',
                transition: lineStyle.transition,
              }}
            />

            {navItems.map((item) => (
              <NavigationMenuLink key={item.key} asChild>
                <Link
                  ref={(el: HTMLAnchorElement | null) => {
                    itemRefs.current[item.key] = el;
                  }}
                  onMouseEnter={() => setHoveredItem(item.key)}
                  className="group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  href={item.href}
                >
                  {item.label}
                </Link>
              </NavigationMenuLink>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </nav>
      <LanguageSwitcher />
    </header>
  );
}
