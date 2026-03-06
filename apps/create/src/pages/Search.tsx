import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label
} from "@party-forever/ui";

interface TokenFormData {
  tokenAddress: string;
}

interface ProfileFormData {
  address: string;
}

export const Search = () => {
  const navigate = useNavigate();
  const tokenForm = useForm<TokenFormData>();
  const profileForm = useForm<ProfileFormData>();

  const onTokenSubmit = (data: TokenFormData) => {
    navigate(`/${data.tokenAddress}`);
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    navigate(`/profile/${data.address.trim()}`);
  };

  return (
    <div className="p-6 flex flex-col lg:flex-row lg:items-start lg:justify-center gap-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>View ERC20 token</CardTitle>
          <CardDescription>
            Enter an ERC20 token address to buy, sell, or trade on Uniswap (Base)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={tokenForm.handleSubmit(onTokenSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="token-address">Token address</Label>
              <Input
                id="token-address"
                placeholder="0x..."
                {...tokenForm.register("tokenAddress")}
              />
            </div>
            <Button type="submit" className="w-full">
              View token
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Example</p>
            <Link
              to="/0x90e3b08e50bf662154964c6051ab3ce64024ff24"
              className="text-sm text-primary underline hover:no-underline hover:text-primary/80 break-all"
            >
              0x90e3b08e50bf662154964c6051ab3ce64024ff24
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Enter a wallet address to view Party ERC20 token holdings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-address">Wallet address</Label>
              <Input
                id="profile-address"
                placeholder="0x..."
                {...profileForm.register("address")}
              />
            </div>
            <Button type="submit" className="w-full">
              View Profile
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Example</p>
            <Link
              to="/profile/0xba5f2ffb721648Ee6a6c51c512A258ec62f1D6af"
              className="text-sm text-primary underline hover:no-underline hover:text-primary/80 break-all"
            >
              0xba5f2ffb721648Ee6a6c51c512A258ec62f1D6af
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>NFTs</CardTitle>
          <CardDescription>
            Party NFTs are pinned on IPFS and available to view and trade via OpenSea.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
