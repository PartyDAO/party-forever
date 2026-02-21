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
  tokenAddress: string;
}

export const Search = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    navigate(`/${data.tokenAddress}`);
  };

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>View token</CardTitle>
          <CardDescription>
            Enter a token address to buy, sell, or trade on Uniswap (Base)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="token-address">Token address</Label>
              <Input id="token-address" placeholder="0x..." {...register("tokenAddress")} />
            </div>
            <Button type="submit" className="w-full">
              View token
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
