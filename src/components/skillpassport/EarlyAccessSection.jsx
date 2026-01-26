import { BoltStyleChat } from '@/components/ui/bolt-style-chat';

export default function EarlyAccessSection() {
  return (
    <section className="bg-white">
      <BoltStyleChat
        title="Early Access Pre-Registration"
        subtitle="Secure your early access to Skill Passport with a one-time pre-registration fee."
        announcementText="Registration Fee: ₹250"
        announcementHref="#registration-form"
        buttonText="Secure payment via Razorpay"
        buttonHref="#registration-form"
        showButtonIcon={true}
        highlightWord="pay"
      />
    </section>
  );
}
