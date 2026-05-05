const FOREVER_APPS = [
  {
    name: "PartyBid / Party / Rooms",
    description: "Manage PartyBid v2, Party protocol parties, and Rooms.",
    href: "/party-protocol/",
    comingSoon: false
  },
  {
    name: "Create",
    description: "Tools for Party token creation and management.",
    href: "/create/",
    comingSoon: false
  },
  {
    name: "PartyBid v1",
    description: "Interact with PartyBid v1 crowdfunds and parties.",
    href: "/partybid/",
    comingSoon: false
  }
];

export const Home = () => (
  <>
    <header className="w-full p-6 border-b border-party-card-border backdrop-blur-md bg-black/20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight party-gradient-text">Party Forever</h1>
      </div>
    </header>

    <main className="w-full max-w-7xl mx-auto flex flex-col gap-10 p-6 py-12">
      <section className="glass-card rounded-xl p-6 border-l-4 border-l-[rgba(0,212,255,0.6)]">
        <p className="text-muted-foreground leading-relaxed">
          The original Party apps have been shut down. Party Forever &mdash; the site you&rsquo;re
          looking at now &mdash; is a minimal, open-source replacement designed to keep running
          indefinitely, with core functionality that depends only on a public Ethereum RPC node and
          no backend services to maintain or break.
        </p>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-foreground">Party Forever Apps</h2>
          <p className="text-sm text-muted-foreground">
            Simplified interfaces for interacting with Party contracts on-chain.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FOREVER_APPS.map((app) => (
            <a
              key={app.name}
              href={app.href}
              className={`glass-card rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 ${
                app.comingSoon
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:border-[rgba(0,212,255,0.3)]"
              }`}
              onClick={app.comingSoon ? (e) => e.preventDefault() : undefined}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-party-accent">{app.name}</h3>
                {app.comingSoon && (
                  <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  </>
);
