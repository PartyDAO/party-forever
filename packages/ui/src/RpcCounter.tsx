import { useSyncExternalStore } from "react";

import { useDeveloperMode } from "./DeveloperModeContext.tsx";
import { rpcCounter } from "./rpc_counter.ts";

const getSnapshot = () => rpcCounter.count;

const RpcCounterBadge = () => {
  const count = useSyncExternalStore(rpcCounter.subscribe, getSnapshot);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(0, 0, 0, 0.75)",
        border: "1px solid rgba(0, 212, 255, 0.3)",
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 12,
        fontFamily: "monospace",
        color: "rgba(0, 212, 255, 0.9)",
        backdropFilter: "blur(8px)",
        userSelect: "none"
      }}
    >
      <span style={{ pointerEvents: "none" }}>RPC: {count}</span>
      <button
        onClick={() => rpcCounter.reset()}
        style={{
          background: "none",
          border: "none",
          color: "rgba(0, 212, 255, 0.5)",
          cursor: "pointer",
          padding: 0,
          fontSize: 12,
          fontFamily: "monospace",
          lineHeight: 1
        }}
      >
        ✕
      </button>
    </div>
  );
};

export const RpcCounter = () => {
  const { developerMode } = useDeveloperMode();
  if (!developerMode) return null;
  return <RpcCounterBadge />;
};
