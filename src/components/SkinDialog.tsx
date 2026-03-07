import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSkin, type CustomSkinInput } from '@/contexts/SkinContext'

interface SkinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SkinDialog({ open, onOpenChange }: SkinDialogProps) {
  const { customInput, setCustomInput } = useSkin()

  const update =
    (key: keyof CustomSkinInput) =>
    (value: string) =>
      setCustomInput({ ...customInput, [key]: value })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Custom Theme</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <ColorField label="Background" value={customInput.background} onChange={update('background')} />
            <ColorField label="Text" value={customInput.foreground} onChange={update('foreground')} />
            <ColorField label="Accent" value={customInput.primary} onChange={update('primary')} />
            <ColorField label="Surface" value={customInput.surface} onChange={update('surface')} />
            <ColorField label="Border" value={customInput.border} onChange={update('border')} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Font</Label>
            <Select value={customInput.fontFamily} onValueChange={update('fontFamily')}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System (sans-serif)</SelectItem>
                <SelectItem value="serif">Serif (Georgia)</SelectItem>
                <SelectItem value="mono">Monospace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Changes apply live as you pick.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-7 w-7 cursor-pointer rounded border border-input bg-transparent p-0 shrink-0"
        />
        <span className="text-xs font-mono text-muted-foreground">{value}</span>
      </div>
    </div>
  )
}
