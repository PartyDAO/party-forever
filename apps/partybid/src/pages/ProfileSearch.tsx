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

interface FormData {
  address: string;
}

export const ProfileSearch = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    navigate(`/profile/${data.address.trim()}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Enter a wallet address to view PartyBid contributions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-address">Wallet Address</Label>
            <Input id="profile-address" placeholder="0x..." {...register("address")} />
          </div>
          <Button type="submit" className="w-full">
            View Profile
          </Button>
        </form>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Example</p>
          <Link
            to="/profile/0x8a333a18B924554D6e83EF9E9944DE6260f61D3B"
            className="text-sm text-primary underline hover:no-underline hover:text-primary/80 break-all"
          >
            0x8a333a18B924554D6e83EF9E9944DE6260f61D3B
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
