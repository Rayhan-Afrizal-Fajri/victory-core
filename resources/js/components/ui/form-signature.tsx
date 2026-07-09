import { useRef} from "react"
import SignatureCanvas from "react-signature-canvas"
import { Button } from "@/components/ui/button"

interface Props {
  label: string
  value?: string | null
  onChange: (value: string | null) => void
}

export default function FormSignature({ label, value, onChange }: Props) {

  const sigRef = useRef<SignatureCanvas>(null)

  const saveSignature = () => {
    if (!sigRef.current) return

    const data = sigRef.current
      .getCanvas()
      .toDataURL("image/png")
    onChange(data)
  }

  const clear = () => {
    sigRef.current?.clear()
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-2">

      <span className="text-xs text-muted-foreground font-medium">
        {label}
      </span>

      <div className="border rounded-lg bg-white overflow-hidden">

        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          onEnd={saveSignature}
          canvasProps={{
            className: "w-full h-40 touch-none"
          }}
          minWidth={1}
          maxWidth={2.5}
          velocityFilterWeight={0.7}
        />

      </div>

      <div className="flex gap-2 flex-wrap">

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={clear}
        >
          Clear
        </Button>

      </div>

      {value && (
        <div className="border rounded-lg p-2 bg-muted/30">

          <p className="text-xs text-muted-foreground mb-1">
            Preview
          </p>

          <img
            src={value}
            className="h-16 object-contain"
          />

        </div>
      )}

    </div>
  )
}