import React, { useState } from 'react';
import { Mail, MessageSquare, MapPin, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SectionHeading } from '@/components/shared/section-heading';
import { toast } from 'sonner';

export function ContactPage() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Message sent! We will get back to you within 24 hours.');
      (e.target as HTMLFormElement).reset();
    }, 1000);
  };

  return (
    <div>
      <section className="pt-32 pb-12 relative">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/40 to-transparent" />
        <div className="container-page relative">
          <SectionHeading
            eyebrow="Contact"
            title="Get in Touch"
            subtitle="Have a question? Our support team is here to help. Reach out and we will respond within 24 hours."
          />
        </div>
      </section>

      <section className="pb-24">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="card-elevated p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 mb-4">
                  <Mail className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-display font-bold mb-1">Email Us</h3>
                <p className="text-sm text-muted-foreground mb-2">For general inquiries</p>
                <a href="mailto:support@fundedshift.com" className="text-sm text-brand-600 hover:underline">
                  support@fundedshift.com
                </a>
              </div>
              <div className="card-elevated p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 mb-4">
                  <MessageSquare className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-display font-bold mb-1">Live Chat</h3>
                <p className="text-sm text-muted-foreground mb-2">Available 24/7</p>
                <p className="text-sm text-brand-600">Start a conversation</p>
              </div>
              <div className="card-elevated p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 mb-4">
                  <MapPin className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-display font-bold mb-1">Office</h3>
                <p className="text-sm text-muted-foreground">
                  Dubai International Financial Centre<br />
                  Dubai, United Arab Emirates
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="card-elevated p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Alex Vance" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="alex@example.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Tell us more..." rows={6} required />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full h-12">
                  {submitting ? 'Sending...' : 'Send Message'}
                  {!submitting && <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
