function navigate(path: string) {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function Footer() {
  return (
    <div className="shrink-0 border-t bg-background px-4 py-1 flex items-center justify-between text-[11px] text-muted-foreground">
      <span>© 2026 LifeSaga</span>
      <button
        onClick={() => navigate('/about')}
        className="hover:underline hover:text-foreground transition-colors"
      >
        About
      </button>
    </div>
  )
}
