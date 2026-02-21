import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { parseEther } from "viem";
import { useAccount } from "wagmi";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  ErrorDisplay,
  Input,
  Label,
  Loading,
  resolveIpfsUrl
} from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";
import type { TokenPageNetwork } from "@/lib/constants.ts";
import {
  buildContributeTx,
  buildWithdrawTx,
  fetchRagequitAmount,
  fetchStaticDetails,
  fetchStatus,
  isOpenCrowdfund,
  loadLaunchForToken,
  type CrowdfundStaticDetails,
  type CrowdfundStatus
} from "@/lib/party_token_launcher.ts";
import { formatEth, formatTokenAmount } from "@/lib/format.ts";
import { getPartyTokenImage } from "@/lib/owned_by_account.ts";
import { fetchTokenMetadataFromChain } from "@/lib/token_metadata.ts";
import type { TokenMetadataBasic } from "@/lib/token_metadata.ts";

const ERC20_BALANCE_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

export const TokenDetails = () => {
  const { address } = useParams<{ address: string }>();
  const { address: userAddress } = useAccount();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenMeta, setTokenMeta] = useState<TokenMetadataBasic | null>(null);
  const [launchData, setLaunchData] = useState<{
    crowdfundAddress: `0x${string}`;
    crowdfundId: string;
  } | null>(null);
  const [status, setStatus] = useState<CrowdfundStatus | null>(null);
  const [staticDetails, setStaticDetails] = useState<CrowdfundStaticDetails | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [userBalanceWei, setUserBalanceWei] = useState<bigint | undefined>(undefined);

  const network: TokenPageNetwork = "base";
  const tokenAddress = address as `0x${string}` | undefined;

  useEffect(() => {
    if (!tokenAddress || !userAddress) return;
    const client = getClient(network);
    client
      .readContract({
        address: tokenAddress,
        abi: ERC20_BALANCE_ABI,
        functionName: "balanceOf" as const,
        args: [userAddress]
      })
      .then(setUserBalanceWei)
      .catch(() => {});
  }, [tokenAddress, userAddress]);

  useEffect(() => {
    if (!tokenAddress) {
      setError("Missing token address");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const [meta, launchResult] = await Promise.all([
          fetchTokenMetadataFromChain(network, tokenAddress),
          loadLaunchForToken(network, tokenAddress)
        ]);
        setTokenMeta(meta);

        console.log("launchResult", launchResult);
        if (!launchResult) {
          setLoading(false);
          return;
        }

        setLaunchData({
          crowdfundAddress: launchResult.crowdfundAddress,
          crowdfundId: launchResult.crowdfundId
        });

        const client = getClient(network);
        const launchId = BigInt(launchResult.crowdfundId);
        const launcherAddress = launchResult.crowdfundAddress;

        const [statusData, staticData] = await Promise.all([
          fetchStatus(client, launcherAddress, launchId),
          fetchStaticDetails(client, launcherAddress, launchId)
        ]);
        setStatus(statusData);
        console.log("statusData", statusData);
        console.log("staticData", staticData);
        setStaticDetails(staticData);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [tokenAddress]);

  const hasLiquidity = useMemo(() => status?.lifecycle === "finalized", [status?.lifecycle]);
  const isActiveCrowdfund = status?.lifecycle === "active";

  if (loading) {
    return <Loading message="Loading token..." />;
  }
  if (error) {
    return <ErrorDisplay message={error} backLink="/" backLabel="Back to search" />;
  }
  if (!tokenMeta || !tokenAddress) {
    return null;
  }

  const tokenImageUri = getPartyTokenImage(tokenAddress);

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3">
        {tokenImageUri && (
          <img
            src={resolveIpfsUrl(tokenImageUri)}
            alt=""
            className="size-20 rounded-xl object-cover ring-2 ring-[#00d4ff]/20"
          />
        )}
        <h1 className="text-2xl font-bold party-gradient-text">{tokenMeta.name}</h1>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{tokenMeta.name}</CardTitle>
          <CardDescription>
            <EtherscanLink network={network} address={tokenAddress} addressType="token" />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {userAddress && userBalanceWei !== undefined && (
            <div>
              <span className="text-sm text-muted-foreground">Your balance: </span>
              <span className="font-medium">
                {formatTokenAmount(userBalanceWei, tokenMeta.decimals)} {tokenMeta.symbol}
              </span>
            </div>
          )}

          {!launchData && (
            <p className="text-sm text-muted-foreground">
              Launch data could not be loaded. Buy and sell are unavailable.
            </p>
          )}

          {hasLiquidity && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                This token has launched. Trade on Uniswap.
              </p>
              <a
                href={`https://app.uniswap.org/swap?chain=base&inputCurrency=ETH&outputCurrency=${tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="default" className="w-full">
                  Trade on Uniswap
                </Button>
              </a>
            </div>
          )}

          {isActiveCrowdfund && launchData && staticDetails && (
            <>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  Launch progress: {formatEth(BigInt(status!.totalContributions))} ETH /{" "}
                  {formatEth(BigInt(status!.targetContribution))} ETH
                </p>
                <p>During the crowdfund you can buy tokens or sell for a refund.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSellModalOpen(true)}
                  disabled={!userBalanceWei || userBalanceWei === 0n}
                >
                  Sell
                </Button>
                <Button className="flex-1" onClick={() => setBuyModalOpen(true)}>
                  Buy
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Link to="/">
        <Button variant="ghost">← Back to search</Button>
      </Link>

      {buyModalOpen && userAddress && launchData && staticDetails && (
        <BuyModal
          network={network}
          tokenAddress={tokenAddress}
          tokenSymbol={tokenMeta.symbol}
          crowdfundAddress={launchData.crowdfundAddress}
          crowdfundId={launchData.crowdfundId}
          staticDetails={staticDetails}
          userAddress={userAddress}
          onClose={() => setBuyModalOpen(false)}
          onSuccess={() => setBuyModalOpen(false)}
        />
      )}

      {sellModalOpen && userAddress && launchData && userBalanceWei !== undefined && (
        <SellModal
          network={network}
          tokenAddress={tokenAddress}
          tokenSymbol={tokenMeta.symbol}
          crowdfundAddress={launchData.crowdfundAddress}
          crowdfundId={launchData.crowdfundId}
          userAddress={userAddress}
          userBalanceWei={userBalanceWei}
          tokenDecimals={tokenMeta.decimals}
          onClose={() => setSellModalOpen(false)}
          onSuccess={() => setSellModalOpen(false)}
        />
      )}
    </div>
  );
};

const MINT_AMOUNTS = ["0.01", "0.025", "0.1"];

const BuyModal = ({
  network,
  tokenAddress,
  tokenSymbol,
  crowdfundAddress,
  crowdfundId,
  staticDetails,
  userAddress: _userAddress,
  onClose,
  onSuccess
}: {
  network: TokenPageNetwork;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  crowdfundAddress: `0x${string}`;
  crowdfundId: string;
  staticDetails: CrowdfundStaticDetails;
  userAddress: `0x${string}`;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [amount, setAmount] = useState(MINT_AMOUNTS[0]);
  const [comment, setComment] = useState("");

  const canBuy = isOpenCrowdfund(staticDetails.merkleRoot);

  const handleBuy = async () => {
    const wei = parseEther(amount);
    const tx = buildContributeTx({
      launcherAddress: crowdfundAddress,
      launchId: Number(crowdfundId),
      tokenAddress,
      comment,
      merkleProof: [],
      valueWei: wei
    });
    return {
      to: tx.to,
      data: tx.data,
      value: tx.value
    };
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Buy {tokenSymbol}</DialogTitle>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <Label>Amount (ETH)</Label>
            <div className="flex gap-2">
              {MINT_AMOUNTS.map((a) => (
                <Button
                  key={a}
                  type="button"
                  variant={amount === a ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(a)}
                >
                  {a}
                </Button>
              ))}
            </div>
            <Input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Comment (optional)</Label>
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Say something..."
            />
          </div>
          {!canBuy && (
            <p className="text-sm text-muted-foreground">
              This crowdfund has an allowlist. Use create.party.app to buy.
            </p>
          )}
          <Web3Button
            network={network}
            txnFn={handleBuy}
            actionName="Buy"
            disabled={!canBuy}
            onSuccess={onSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SellModal = ({
  network,
  tokenSymbol,
  crowdfundAddress,
  crowdfundId,
  userAddress,
  userBalanceWei,
  tokenDecimals,
  onClose,
  onSuccess
}: {
  network: TokenPageNetwork;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  crowdfundAddress: `0x${string}`;
  crowdfundId: string;
  userAddress: `0x${string}`;
  userBalanceWei: bigint;
  tokenDecimals: number;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [ethRefund, setEthRefund] = useState<bigint | null>(null);

  useEffect(() => {
    const client = getClient(network);
    fetchRagequitAmount(client, crowdfundAddress, BigInt(crowdfundId), userBalanceWei).then(
      ({ ethRefund: refund }) => setEthRefund(refund)
    );
  }, [network, crowdfundAddress, crowdfundId, userBalanceWei]);

  const handleSell = async () => {
    const tx = buildWithdrawTx({
      launcherAddress: crowdfundAddress,
      launchId: Number(crowdfundId),
      receiver: userAddress
    });
    return {
      to: tx.to,
      data: tx.data,
      value: tx.value
    };
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Sell {tokenSymbol}</DialogTitle>
        <DialogDescription>
          Sell your tokens for a refund. A 1% withdrawal fee will be applied.
        </DialogDescription>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1 text-sm">
            <p>
              Balance: {formatTokenAmount(userBalanceWei, tokenDecimals)} {tokenSymbol}
            </p>
            {ethRefund !== null && <p>You will receive: {formatEth(ethRefund)} ETH</p>}
          </div>
          <Web3Button
            network={network}
            txnFn={handleSell}
            actionName="Sell for refund"
            variant="destructive"
            onSuccess={onSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
