// warehouse:file
// responsibility: undefined
// actor: undefined
// role: undefined
// source_truth: implementation

// warehouse:method
// responsibility: undefined
// actor: method_implementation
// role: implementation
// source_truth: implementation
function createLineHandler(onProgress, onError, onFallback) {
  return (line) => {
    // Match packet completion: [bee N] packet X/40 (NN files): NN ok, N error
    const packetMatch = line.match(/\[bee \d+\] packet \d+\/\d+ \((\d+) files\): (\d+) ok, (\d+) error/);
    if (packetMatch) {
      const filesInPacket = parseInt(packetMatch[1]);
      const filesOk = parseInt(packetMatch[2]);
      const filesError = parseInt(packetMatch[3]);

      if (filesOk > 0) {
        const now = new Date();
        onProgress({
          timestamp: now,
          filesOk,
          filesInPacket,
          message: `✅ [${now.toLocaleTimeString()}] ${filesOk} files completed (packet: ${filesInPacket})`
        });
      }

      if (filesError > 0) {
        const now = new Date();
        onError({
          timestamp: now,
          filesError,
          message: `⚠️  [${now.toLocaleTimeString()}] ${filesError} errors in packet`
        });
      }
    }

    // Match fallback events
    if (line.includes("falling back to Pro")) {
      const now = new Date();
      onFallback({
        timestamp: now,
        message: `↔️  [${now.toLocaleTimeString()}] Fallback triggered: Flash → Pro`
      });
    }
  };
}

module.exports = { createLineHandler };
