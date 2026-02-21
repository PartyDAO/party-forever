import { Card, CardContent } from "./Card.tsx";

interface LoadingProps {
  message?: string;
}

export const Loading = ({ message = "Loading..." }: LoadingProps) => {
  return (
    <div className="p-4 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6 flex flex-col items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-[#00d4ff]/30 border-t-[#00d4ff] animate-spin" />
          <p className="text-center text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
};
