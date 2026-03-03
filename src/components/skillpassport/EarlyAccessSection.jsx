import { BoltStyleChat } from '@/components/ui/bolt-style-chat';

export default function EarlyAccessSection() {
  return (
    <section className="bg-white">
      <BoltStyleChat
        title="Early Access Registration"
        subtitle="Secure your early access to Skill Passport with a one-time registration fee."
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
