import { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookingParams } from '@/validators/bookingPolicySchema';

interface JsonPreviewCardProps {
  params: BookingParams;
}

export function JsonPreviewCard({ params }: JsonPreviewCardProps) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(params, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="h-4 w-4" />
            Preview JSON
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border bg-muted/50 p-4">
          <pre className="text-xs font-mono text-muted-foreground">
            {jsonString}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
