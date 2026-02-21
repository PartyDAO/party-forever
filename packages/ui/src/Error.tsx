import { Link } from "react-router";

import { Button } from "./Button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "./Card.tsx";

interface ErrorProps {
  message: string;
  backLink?: string;
  backLabel?: string;
}

export const ErrorDisplay = ({ message, backLink = "/", backLabel = "Go Back" }: ErrorProps) => {
  return (
    <div className="p-4 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{message}</p>
          <Link to={backLink}>
            <Button variant="outline">{backLabel}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};
