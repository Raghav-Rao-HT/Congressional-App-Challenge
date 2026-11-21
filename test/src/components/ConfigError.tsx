export function ConfigError({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-fg">VetWork isn't set up yet</h1>
      <p className="mt-3 text-sm text-muted">
        This copy of the site was built without its Firebase settings, so it can't start. The site owner needs to add the
        variables below to the host's build environment and redeploy.
      </p>
      <ul className="mt-6 space-y-1 text-left text-sm">
        {missing.map((name) => (
          <li key={name}>
            <code className="rounded-lg bg-surface-2 px-2 py-1 font-mono text-xs text-fg">{name}</code>
          </li>
        ))}
      </ul>
    </main>
  )
}
