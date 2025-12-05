'use client';

import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Facebook, Twitter, Instagram, Youtube, Rss } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: 'Sections',
      links: ['Top Stories', 'Politics', 'Elections', 'Analysis', 'Opinion']
    },
    {
      title: 'About',
      links: ['About Us', 'Contact', 'Careers', 'Advertise', 'Press']
    },
    {
      title: 'Legal',
      links: ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Accessibility']
    }
  ];

  const socialLinks = [
    { icon: Facebook, label: 'Facebook' },
    { icon: Twitter, label: '' },
    { icon: Instagram, label: 'Instagram' },
    { icon: Youtube, label: 'YouTube' },
    { icon: Rss, label: 'RSS Feed' }
  ];

  return (
    <footer className="bg-card border-t border-border mt-12 mb-16 md:mb-0">
      <div className="container mx-auto px-4 py-3 md:py-12">
        {/* Mobile: Minimal Layout */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-primary">The Capitol</h2>
            <div className="flex gap-1.5">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <button
                    key={social.label}
                    className="p-1 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full mb-3">
            <AccordionItem value="links" className="border-b-0">
              <AccordionTrigger className="text-xs font-medium py-2 hover:no-underline">
                Quick Links
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-3 pb-2">
                  {sections.map((section) => (
                    <div key={section.title}>
                      <h4 className="text-xs font-semibold mb-1.5">{section.title}</h4>
                      <ul className="space-y-1">
                        {section.links.map((link) => (
                          <li key={link}>
                            <a
                              href="#"
                              className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                            >
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="text-[10px] text-center text-muted-foreground">
            © {currentYear} The Capitol
          </p>
        </div>

        {/* Desktop: Full Layout */}
        <div className="hidden md:block">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-primary mb-4">The Capitol</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your trusted source for political news, election coverage, and in-depth analysis.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <button
                    key={social.label}
                    className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-3 gap-8 mb-8">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Separator className="my-8" />

          <div className="flex flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} The Capitol. All rights reserved.</p>
            <p>Made with ❤️ for democracy</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
