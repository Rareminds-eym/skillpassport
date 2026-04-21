import { BoltStyleChat } from '@/shared/ui';

export default function EarlyAccessSection() {
  return (
    <section className="bg-white">
      <BoltStyleChat
        title="Early Access Registration"
        subtitle="Secure your early access to Skill Ecosystem with a one-time registration fee."
        announcementText="Registration Fee: ₹499"
        announcementHref="#registration-form"
        buttonText="Secure payment via Razorpay"
        buttonHref="#registration-form"
        showButtonIcon={true}
        highlightWord="pay"
      />
    </section>
  );
}
