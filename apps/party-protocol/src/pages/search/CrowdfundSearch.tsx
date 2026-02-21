import type { NetworkName } from "@party-forever/contracts";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select
} from "@party-forever/ui";
import { NETWORK_OPTIONS } from "@/lib/constants.ts";

interface FormData {
  contractAddress: string;
  network: NetworkName;
}

export const CrowdfundSearch = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, control } = useForm<FormData>({
    defaultValues: {
      network: "base"
    }
  });

  const onSubmit = (data: FormData) => {
    navigate(`/crowdfund/${data.network}/${data.contractAddress}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Crowdfund</CardTitle>
        <CardDescription>Enter a crowdfund address to view details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="crowdfund-network">Network</Label>
            <Controller
              name="network"
              control={control}
              render={({ field }) => (
                <Select
                  options={NETWORK_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  id="crowdfund-network"
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="crowdfund-address">Contract Address</Label>
            <Input id="crowdfund-address" placeholder="0x..." {...register("contractAddress")} />
          </div>
          <Button type="submit" className="w-full">
            View Crowdfund
          </Button>
        </form>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Examples</p>
          <Link
            to="/crowdfund/mainnet/0x8c2f23a3ecdaaf25438302925c7f2e9591c25e16"
            className="text-sm text-primary underline hover:no-underline hover:text-primary/80"
          >
            Party Shield
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
