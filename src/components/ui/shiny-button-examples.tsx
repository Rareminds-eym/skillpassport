/**
 * ShinyButton - Usage Examples
 * 
 * This file demonstrates various ways to use the ShinyButton component
 * in different contexts and with different customizations.
 */

import { ShinyButton } from "@/components/ui/shiny-button";
import { Lock, ChevronRight, Download, Send, Check, Loader2 } from "lucide-react";
import { useState } from "react";

// Example 1: Basic Usage
export function BasicExample() {
  return (
    <ShinyButton onClick={() => console.log("Clicked!")}>
      Get Started
    </ShinyButton>
  );
}

// Example 2: With Icons
export function WithIconsExample() {
  return (
    <ShinyButton onClick={() => console.log("Registration clicked")}>
      <div className="flex items-center gap-2">
        <Lock className="w-5 h-5" />
        <span>Complete Pre-Registration</span>
        <ChevronRight className="w-5 h-5" />
      </div>
    </ShinyButton>
  );
}

// Example 3: Loading State
export function LoadingExample() {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <ShinyButton onClick={handleClick} disabled={loading}>
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing...</span>
        </div>
      ) : (
        <span>Submit</span>
      )}
    </ShinyButton>
  );
}

// Example 4: Form Submit
export function FormSubmitExample() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("Form submitted!");
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <input
        type="email"
        placeholder="Enter your email"
        className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
        required
      />
      <ShinyButton type="submit" disabled={loading}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Sending...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            <span>Send</span>
          </div>
        )}
      </ShinyButton>
    </form>
  );
}

// Example 5: Download Button
export function DownloadExample() {
  return (
    <ShinyButton onClick={() => console.log("Downloading...")}>
      <div className="flex items-center gap-2">
        <Download className="w-5 h-5" />
        <span>Download Now</span>
      </div>
    </ShinyButton>
  );
}

// Example 6: Success Button
export function SuccessExample() {
  return (
    <ShinyButton onClick={() => console.log("Success!")}>
      <div className="flex items-center gap-2">
        <Check className="w-5 h-5" />
        <span>Confirmed</span>
      </div>
    </ShinyButton>
  );
}

// Example 7: Disabled State
export function DisabledExample() {
  return (
    <ShinyButton disabled>
      Disabled Button
    </ShinyButton>
  );
}

// Example 8: Custom Styling
export function CustomStyleExample() {
  return (
    <ShinyButton className="text-sm px-4 py-2">
      Small Button
    </ShinyButton>
  );
}

// Example 9: Registration Form Integration
export function RegistrationFormExample() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVerified(true);
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-white mb-2">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
          required
        />
      </div>
      <ShinyButton type="submit" disabled={loading || !email}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : verified ? (
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5" />
            <span>Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span>Complete Pre-Registration</span>
            <ChevronRight className="w-5 h-5" />
          </div>
        )}
      </ShinyButton>
    </form>
  );
}

// Demo Component showing all examples
export default function ShinyButtonExamples() {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="text-4xl font-bold text-white mb-8">ShinyButton Examples</h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Basic Usage</h2>
          <BasicExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">With Icons</h2>
          <WithIconsExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Loading State</h2>
          <LoadingExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Form Submit</h2>
          <FormSubmitExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Download Button</h2>
          <DownloadExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Success Button</h2>
          <SuccessExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Disabled State</h2>
          <DisabledExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Custom Styling</h2>
          <CustomStyleExample />
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Registration Form</h2>
          <RegistrationFormExample />
        </section>
      </div>
    </div>
  );
}
