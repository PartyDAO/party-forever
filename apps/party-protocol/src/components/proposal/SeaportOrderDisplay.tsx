import type { NetworkName, SeaportOrderDetails } from "@party-forever/contracts";

import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { formatDateWithTimezone, formatEth } from "@/lib/format.ts";

import { NftDecodeSection } from "./NftDecodeSection.tsx";

const SeaportRow = ({ label, children }: { label: string; children: React.ReactNode }) => {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      {children}
    </div>
  );
};

interface SeaportOrderDisplayProps {
  order: SeaportOrderDetails;
  network: NetworkName;
}

export const SeaportOrderDisplay = ({ order, network }: SeaportOrderDisplayProps) => {
  return (
    <div className="text-xs bg-muted p-3 rounded space-y-1">
      <div className="font-medium text-sm">Seaport Order</div>
      <SeaportRow label="Order Hash">
        <span className="font-mono break-all">{order.orderHash}</span>
      </SeaportRow>
      <SeaportRow label="Token">
        <EtherscanLink network={network} address={order.token} addressType="token" />
      </SeaportRow>
      <SeaportRow label="Token ID">
        <span className="font-mono">{order.tokenId.toString()}</span>
      </SeaportRow>
      {order.type === "standard" ? (
        <SeaportRow label="List Price">
          <span>{formatEth(order.listPriceWei)} ETH</span>
        </SeaportRow>
      ) : (
        <>
          <SeaportRow label="Start Price">
            <span>{formatEth(order.startPriceWei)} ETH</span>
          </SeaportRow>
          <SeaportRow label="End Price">
            <span>{formatEth(order.endPriceWei)} ETH</span>
          </SeaportRow>
        </>
      )}
      <SeaportRow label="Expiry">
        <span>{formatDateWithTimezone(Number(order.expiry))}</span>
      </SeaportRow>
      <SeaportRow label="Order Status">
        {order.orderStatus.totalFilled === order.orderStatus.totalSize &&
        order.orderStatus.totalSize > 0n ? (
          <span className="text-green-700">Sold!</span>
        ) : (
          <span className="text-yellow-700">Unsold</span>
        )}
      </SeaportRow>

      <NftDecodeSection network={network} token={order.token} tokenId={order.tokenId} />
    </div>
  );
};
