/** Re-mounts on navigation, giving each page a subtle fade-in. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
