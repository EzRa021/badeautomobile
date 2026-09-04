import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Links to the document's PDF route. "Download" forces a file download; "Print"
 * opens the inline PDF in a new tab where the browser print dialog is available.
 */
export function PdfButtons({ basePath }: { basePath: string }) {
  return (
    <>
      <Button asChild variant="outline" size="sm">
        <a href={`${basePath}?download=1`}>
          <Download /> Download PDF
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={basePath} target="_blank" rel="noopener noreferrer">
          <Printer /> Print
        </a>
      </Button>
    </>
  );
}
