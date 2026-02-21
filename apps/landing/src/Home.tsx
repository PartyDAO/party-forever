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

const LEGACY_SITES = [
  {
    name: "v1.partybid.app",
    description: "Original PartyBid v1 interface.",
    href: "https://v1.partybid.app"
  },
  {
    name: "party.app",
    description: "Party protocol app.",
    href: "https://party.app"
  },
  {
    name: "rooms.party.app",
    description: "Rooms by Party.",
    href: "https://rooms.party.app"
  },
  {
    name: "create.party.app",
    description: "Party token creation.",
    href: "https://create.party.app"
  }
];

const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="inline-block ml-1.5 opacity-50"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

export const Home = () => (
  <>
    <header className="w-full p-6 border-b border-party-card-border backdrop-blur-md bg-black/20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight party-gradient-text">Party Forever</h1>
      </div>
    </header>

    <main className="w-full max-w-7xl mx-auto flex flex-col gap-10 p-6 py-12">
      <section className="glass-card rounded-xl p-6 border-l-4 border-l-amber-500/60">
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-amber-400">Important Notice</h2>
          <p className="text-muted-foreground leading-relaxed">
            Party products are deprecated. In the future, the apps may not function fully featured
            or at all. Use the &ldquo;forever&rdquo; links listed below to facilitate interacting
            with your parties. We suggest winding down party activities at your nearest convenience.
          </p>
        </div>
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

      <div className="border-t border-party-card-border" />

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-foreground">Legacy Sites</h2>
          <p className="text-sm text-muted-foreground">
            Original Party product sites. These may stop working at any time.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {LEGACY_SITES.map((site) => (
            <a
              key={site.name}
              href={site.href}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card rounded-xl p-5 flex flex-col gap-2 transition-all duration-200 hover:border-[rgba(0,212,255,0.3)]"
            >
              <h3 className="text-sm font-semibold text-foreground">
                {site.name}
                <ExternalLinkIcon />
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{site.description}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  </>
);
