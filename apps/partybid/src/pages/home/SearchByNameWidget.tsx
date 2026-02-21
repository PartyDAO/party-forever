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

interface NameFormData {
  name: string;
}

export const SearchByNameWidget = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm<NameFormData>();

  const onSubmit = (data: NameFormData) => {
    const trimmed = data.name.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Search for Party by Name</CardTitle>
        <CardDescription>Search PartyBid by name to find a party</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="party-name">Name</Label>
            <Input
              id="party-name"
              placeholder="Search by name…"
              {...register("name", { required: true })}
            />
          </div>
          <Button type="submit" className="w-full">
            Search
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
