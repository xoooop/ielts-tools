"use client";

// Google AdSense placeholder — replace data-ad-client with your publisher ID after ICP
// Uncomment the ins element below when ready to go live with ads

export default function AdBanner({ slot }: { slot: string }) {
  // AdSense disabled by default — enable when you have a publisher ID
  const ADS_ENABLED = false;
  const PUBLISHER_ID = ""; // ca-pub-xxxxxxxxxxxxxxxx

  if (!ADS_ENABLED || !PUBLISHER_ID) return null;

  return (
    <div className="my-6 overflow-hidden rounded-2xl">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
