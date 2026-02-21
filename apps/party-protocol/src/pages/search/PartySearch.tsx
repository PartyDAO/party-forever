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

export const PartySearch = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, control } = useForm<FormData>({
    defaultValues: {
      network: "base"
    }
  });

  const onSubmit = (data: FormData) => {
    navigate(`/party/${data.network}/${data.contractAddress}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Party</CardTitle>
        <CardDescription>Enter a party address to view details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="party-network">Network</Label>
            <Controller
              name="network"
              control={control}
              render={({ field }) => (
                <Select
                  options={NETWORK_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  id="party-network"
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="party-address">Contract Address</Label>
            <Input id="party-address" placeholder="0x..." {...register("contractAddress")} />
          </div>
          <Button type="submit" className="w-full">
            View Party
          </Button>
        </form>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Examples</p>
          <Link
            to="/party/mainnet/0x87088b14c02e639453e91b4588611d4042ca1fc0"
            className="text-sm text-primary underline hover:no-underline hover:text-primary/80"
          >
            team-frontend
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
