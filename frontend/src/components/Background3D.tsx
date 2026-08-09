// Pure CSS animated background — replaces Three.js entirely.
// Uses CSS keyframe animations and GPU-composited transforms only.
// Zero JS overhead after mount.
export default function Background() {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: '#050505',
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient blobs — GPU accelerated */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Subtle noise overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)',
      }} />
    </div>
  );
}
