import { ShinyButton } from "@/components/ui/shiny-button";

export default function ShinyButtonDemo() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <ShinyButton onClick={() => alert("Button clicked!")}>
        Get unlimited access
      </ShinyButton>
    </div>
  );
}
