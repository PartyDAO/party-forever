import type {
  GovernanceValues,
  NetworkName,
  PartyCreationData,
  TxData
} from "@party-forever/contracts";
import { RAGE_QUIT_FOREVER } from "@party-forever/contracts";

import { Button, ExternalLinkIcon } from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { formatBps, formatDate, formatDuration } from "@/lib/format.ts";
import { getOpenseaAssetUrl } from "@/lib/opensea.ts";

interface GovernanceTabProps {
  governanceValues: GovernanceValues;
  partyName: string;
  partyAddress: `0x${string}`;
  network: NetworkName;
  rageQuitTimestamp?: number | null;
  supportsSetRageQuit?: boolean;
  isHost?: boolean;
  isMember?: boolean;
  enableRageQuitTxData?: TxData | null;
  disableRageQuitTxData?: TxData | null;
  onRageQuitSuccess?: () => void;
  onOpenRageQuit?: () => void;
  partyCreationData?: PartyCreationData;
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm break-all">{children}</dd>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold border-b border-border pb-2">{title}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">{children}</dl>
    </section>
  );
};

const PreciousTokensList = ({
  partyCreationData,
  network
}: {
  partyCreationData: PartyCreationData;
  network: NetworkName;
}) => {
  if (partyCreationData.preciousTokens.length === 0) {
    return <span className="text-muted-foreground">None</span>;
  }
  return (
    <div className="flex flex-col gap-2">
      {partyCreationData.preciousTokens.map((token, i) => {
        const tokenId = partyCreationData.preciousTokenIds[i].toString();
        return (
          <div key={`${token}-${tokenId}`} className="flex items-center gap-2">
            <EtherscanLink network={network} address={token} addressType="token" />
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              #{tokenId}
              <a
                href={getOpenseaAssetUrl(network, token, tokenId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <ExternalLinkIcon />
              </a>
            </span>
          </div>
        );
      })}
    </div>
  );
};

const HostsList = ({
  partyCreationData,
  network
}: {
  partyCreationData: PartyCreationData;
  network: NetworkName;
}) => {
  if (partyCreationData.hosts.length === 0) {
    return <span className="text-muted-foreground">None</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {partyCreationData.hosts.map((host) => (
        <EtherscanLink key={host} network={network} address={host} addressType="address" />
      ))}
    </div>
  );
};

const formatRageQuitStatus = (rageQuitTimestamp: number | null): string => {
  if (rageQuitTimestamp === null) {
    return "Not supported";
  }
  if (rageQuitTimestamp === 0) {
    return "Off";
  }
  if (rageQuitTimestamp >= RAGE_QUIT_FOREVER) {
    return "On (no deadline)";
  }
  return `On (until ${formatDate(rageQuitTimestamp)})`;
};

export const GovernanceTab = ({
  governanceValues,
  partyName,
  partyAddress,
  network,
  rageQuitTimestamp = null,
  supportsSetRageQuit = false,
  isHost = false,
  isMember = false,
  enableRageQuitTxData,
  disableRageQuitTxData,
  onRageQuitSuccess,
  onOpenRageQuit,
  partyCreationData
}: GovernanceTabProps) => {
  const canToggleRageQuit =
    supportsSetRageQuit &&
    isHost &&
    enableRageQuitTxData != null &&
    disableRageQuitTxData != null &&
    rageQuitTimestamp !== null;

  const rageQuitEnabled = rageQuitTimestamp != null && rageQuitTimestamp !== 0;
  const showRageQuitButton = rageQuitEnabled && isMember && onOpenRageQuit;

  return (
    <div className="flex flex-col gap-8">
      <Section title="Party Info">
        <Field label="Name">{partyName}</Field>
        <Field label="Network">{network}</Field>
        <Field label="Address">
          <EtherscanLink network={network} address={partyAddress} addressType="address" />
        </Field>
        {partyCreationData && (
          <Field label="Hosts">
            <HostsList partyCreationData={partyCreationData} network={network} />
          </Field>
        )}
      </Section>

      <Section title="Voting">
        <Field label="Vote Duration">{formatDuration(governanceValues.voteDuration)}</Field>
        <Field label="Execution Delay">{formatDuration(governanceValues.executionDelay)}</Field>
        <Field label="Pass Threshold">{formatBps(governanceValues.passThresholdBps)}</Field>
        <Field label="Total Voting Power">{governanceValues.totalVotingPower.toString()}</Field>
      </Section>

      {partyCreationData && partyCreationData.preciousTokens.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold border-b border-border pb-2">Precious Tokens</h3>
          <PreciousTokensList partyCreationData={partyCreationData} network={network} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold border-b border-border pb-2">Rage Quit</h3>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm">{formatRageQuitStatus(rageQuitTimestamp)}</span>
          {canToggleRageQuit && (
            <>
              {rageQuitTimestamp === 0 && enableRageQuitTxData && (
                <Web3Button
                  networkName={network}
                  txnFn={async () => enableRageQuitTxData}
                  actionName="Enable Rage Quit"
                  onSuccess={onRageQuitSuccess}
                />
              )}
              {rageQuitTimestamp !== 0 && disableRageQuitTxData && (
                <Web3Button
                  networkName={network}
                  txnFn={async () => disableRageQuitTxData}
                  actionName="Disable Rage Quit"
                  onSuccess={onRageQuitSuccess}
                  variant="destructive"
                />
              )}
            </>
          )}
          {showRageQuitButton && (
            <Button variant="destructive" onClick={onOpenRageQuit} className="text-black font-bold">
              Rage Quit
            </Button>
          )}
        </div>
      </section>
    </div>
  );
};
