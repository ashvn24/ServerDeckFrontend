import { useRef, useEffect } from 'react';

export default function Terminal({ lines = [], autoScroll = true, className = '' }) {
  const containerRef = useRef();

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  return (
    <div
      ref={containerRef}
      className={`bg-gray-950 rounded-xl p-4 overflow-auto terminal-scroll font-mono text-sm leading-relaxed ${className}`}
      style={{ minHeight: '300px', maxHeight: '500px' }}
    >
      {lines.length === 0 ? (
        <p className="text-gray-600 italic">No log output</p>
      ) : (
        lines.map((line, i) => (
          <div key={i} className="text-green-400 whitespace-pre-wrap break-all">
            {line}
          </div>
        ))
      )}
    </div>
  );
}
