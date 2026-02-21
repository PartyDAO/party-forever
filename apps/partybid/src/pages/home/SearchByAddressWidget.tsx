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

const EXAMPLES = [
  { name: "Party Of The Living Dead", address: "0x2912F57F93dD69FBbF477B616D6f8C34C49bb282" },
  { name: "Doodle", address: "0x0171de7ba632c6cb144bd8b967553f262b6556ce" }
];

interface AddressFormData {
  partyAddress: string;
}

export const SearchByAddressWidget = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<AddressFormData>();

  const onSubmit = (data: AddressFormData) => {
    navigate(`/party/${data.partyAddress.trim()}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Search for Party by Address</CardTitle>
        <CardDescription>Enter a PartyBid address to view details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="party-address">Party Address</Label>
            <Input
              id="party-address"
              placeholder="0x..."
              {...register("partyAddress", { required: true })}
            />
          </div>
          <Button type="submit" className="w-full">
            View Party
          </Button>
        </form>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Examples</p>
          <div className="flex flex-col gap-1">
            {EXAMPLES.map((ex) => (
              <Link
                key={ex.address}
                to={`/party/${ex.address}`}
                className="text-sm text-primary underline hover:no-underline hover:text-primary/80 break-all"
              >
                {ex.name}
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
