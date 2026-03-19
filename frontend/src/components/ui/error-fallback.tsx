import { Button } from "@/components/ui/button";
import { FullscreenState } from "@/components/ui/fullscreen-state";

type ErrorFallbackProps = {
  title: string;
  description: string;
  onRetry?: () => void;
};

export function ErrorFallback({ title, description, onRetry }: ErrorFallbackProps) {
  return (
    <FullscreenState
      eyebrow="Estabilidade"
      title={title}
      description={description}
      action={
        <div className="flex flex-col gap-3">
          {onRetry ? (
            <Button className="w-full" onClick={onRetry} type="button">
              Tentar novamente
            </Button>
          ) : null}
          <Button
            className="w-full"
            onClick={() => window.location.assign("/")}
            type="button"
            variant="secondary"
          >
            Voltar ao inicio
          </Button>
        </div>
      }
    />
  );
}
