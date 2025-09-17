import React, { useState } from 'react';
import { Button, Card } from '@carrierllm/ui';

interface ContactModalProps {
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  const [formType, setFormType] = useState<'contact' | 'demo'>('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: '',
    preferredTime: '',
    emailOptIn: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.emailOptIn) {
      alert('Please agree to receive emails from CarrierLLM to submit the form.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to worker endpoint for email handling
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://carrierllm-worker.wandering-pine-b19a.workers.dev/api'}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: formType,
          ...formData,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSubmitted(true);

        // If demo request, also open Cal.com
        if (formType === 'demo') {
          const calLink = import.meta.env.VITE_CAL_LINK || 'https://cal.com/carrierllm';
          setTimeout(() => {
            window.open(calLink, '_blank', 'width=800,height=600');
          }, 1000);
        }
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Failed to submit form. Please try again or email us directly at info@carrierllm.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    setFormData({
      ...formData,
      [target.name]: value
    });
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
        <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <Card className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[color:var(--color-gray-900)] mb-2">Thank You!</h2>
            <p className="text-[color:var(--color-gray-600)] mb-4">
              {formType === 'demo'
                ? "We've received your demo request. You'll be redirected to schedule a time that works for you."
                : "We've received your message and will get back to you within 24 hours."
              }
            </p>
            <Button onClick={onClose} className="w-full">Close</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl"
          aria-label="Close"
        >
          ✕
        </button>

        <Card>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[color:var(--color-gray-900)] mb-2">
              {formType === 'demo' ? 'Schedule a Demo' : 'Contact Sales'}
            </h2>
            <p className="text-[color:var(--color-gray-600)]">
              {formType === 'demo'
                ? 'See CarrierLLM in action with a personalized demo'
                : 'Get in touch with our sales team for enterprise inquiries'
              }
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setFormType('contact')}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                formType === 'contact'
                  ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]'
                  : 'bg-white text-[color:var(--color-gray-600)] border-[color:var(--color-gray-300)] hover:border-[color:var(--color-primary)]'
              }`}
            >
              Contact Sales
            </button>
            <button
              onClick={() => setFormType('demo')}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                formType === 'demo'
                  ? 'bg-[color:var(--color-primary)] text-white border-[color:var(--color-primary)]'
                  : 'bg-white text-[color:var(--color-gray-600)] border-[color:var(--color-gray-300)] hover:border-[color:var(--color-primary)]'
              }`}
            >
              Schedule Demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-gray-700)] mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-[color:var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-gray-700)] mb-1">
                  Company *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-[color:var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-gray-700)] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-[color:var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-gray-700)] mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[color:var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                />
              </div>
            </div>

            {formType === 'demo' && (
              <div>
                <label className="block text-sm font-medium text-[color:var(--color-gray-700)] mb-1">
                  Preferred Demo Time
                </label>
                <input
                  type="text"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                  placeholder="e.g., Weekdays 2-4pm EST"
                  className="w-full px-3 py-2 border border-[color:var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[color:var(--color-gray-700)] mb-1">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                placeholder={formType === 'demo'
                  ? "Tell us about your team size and what you'd like to see in the demo..."
                  : "How can we help your insurance agency?"
                }
                className="w-full px-3 py-2 border border-[color:var(--color-gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] resize-none"
              />
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                name="emailOptIn"
                id="emailOptIn"
                checked={formData.emailOptIn}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-[color:var(--color-primary)] border-[color:var(--color-gray-300)] rounded focus:ring-[color:var(--color-primary)]"
              />
              <label htmlFor="emailOptIn" className="text-sm text-[color:var(--color-gray-700)] leading-5">
                I agree to receive emails from CarrierLLM including product updates, industry insights, and promotional content.
                <span className="text-red-500"> *</span>
                <div className="text-xs text-[color:var(--color-gray-500)] mt-1">
                  Required to submit this form. You can unsubscribe at any time.
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : formType === 'demo' ? 'Request Demo' : 'Send Message'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-center text-[color:var(--color-gray-500)]">
              Or email us directly at{' '}
              <a href="mailto:info@carrierllm.com" className="text-[color:var(--color-primary)] underline">
                info@carrierllm.com
              </a>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ContactModal;