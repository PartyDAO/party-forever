import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

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
    navigate(`/profile/${data.address}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Enter a wallet address to view contributions</CardDescription>
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
      </CardContent>
    </Card>
  );
};
