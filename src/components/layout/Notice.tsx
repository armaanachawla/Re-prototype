import { FlaskConical } from "lucide-react";

export const CONCEPT_NOTICE =
  "Concept prototype. RE is a proposed product: the wearable and its sensors do not exist yet, and every value shown is simulated, illustrative sample data. RE is not a clinically validated or approved medical device and is not intended for diagnosis or treatment.";

export function ConceptBanner() {
  return (
    <div className="no-print border-b border-line bg-sand-soft">
      <p className="mx-auto flex max-w-[1280px] items-start gap-2 px-4 py-2 text-[13px] leading-snug text-taupe sm:px-6 lg:px-8">
        <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sand-deep" aria-hidden />
        <span>
          <strong className="font-medium text-ink">Concept prototype.</strong> All data is simulated and illustrative. RE is not an existing or clinically validated medical device.
        </span>
      </p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="no-print mt-16 border-t border-line bg-cream">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-4">
          <p className="font-serif text-3xl text-ink">RE</p>
          <p className="mt-1 text-taupe">Recovery, in motion.</p>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-taupe md:col-span-8">
          <p className="text-ink">{CONCEPT_NOTICE}</p>
          <p>
            The sample patient, physiotherapist, exercises and measurements are fictional. The sample exercises are illustrative and are not an exercise prescription. Always follow the plan agreed with your own physiotherapist or clinician.
          </p>
          <p>This prototype stores no personal data, uses no patient database, connects to no device and makes no claim of compliance with healthcare privacy regulations.</p>
        </div>
      </div>
    </footer>
  );
}
