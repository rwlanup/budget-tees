'use client';

import { StorefrontContainer } from '@/components/storefront/storefront-container';
import { Card } from '@/components/ui/card';
import { ContactForm } from '@/modules/contact/components/contact-form';

export default function ContactPage() {
  return (
    <StorefrontContainer className="py-8">
      <h1 className="mb-2 font-heading text-2xl font-bold">Contact us</h1>
      <p className="mb-6 max-w-prose text-sm text-muted-foreground">
        Have a question about an order, a product, or your account? Send us a message and our team
        will get back to you. No account needed.
      </p>
      <Card className="max-w-2xl p-6">
        <ContactForm />
      </Card>
    </StorefrontContainer>
  );
}
