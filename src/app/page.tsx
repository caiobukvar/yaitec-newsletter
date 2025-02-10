import NewsletterSubscriptionCard from "./components/NewsletterSubscriptionCard/page";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-4 sm:pb-0 sm:gap-4 font-[family-name:var(--font-geist-sans)]">
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center sm:items-start">
        <NewsletterSubscriptionCard />
      </main>
    </div>
  );
}
