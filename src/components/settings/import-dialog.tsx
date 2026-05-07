import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type ImportDialogProps = {
  onFileSelected: (file: File) => void
}

export function ImportDialog({ onFileSelected }: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setOpen(false)
    onFileSelected(file)
    e.target.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>Import CSV</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Expenses</DialogTitle>
          <DialogDescription>
            Upload a CSV file. All expenses will be imported using your app's primary currency. Any extra columns are silently ignored.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <p className="mb-2 font-medium">Required columns</p>
            <table className="w-full text-left">
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-1.5 pr-4 font-mono text-xs">name</td>
                  <td className="py-1.5 text-muted-foreground">Transaction description</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 font-mono text-xs">amount</td>
                  <td className="py-1.5 text-muted-foreground">Signed number — negative for expenses, positive for income</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 font-mono text-xs">category</td>
                  <td className="py-1.5 text-muted-foreground">Category name — auto-created if not found</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 font-mono text-xs">date</td>
                  <td className="py-1.5 text-muted-foreground">
                    <span className="font-mono">YYYY-MM-DD</span> or ISO timestamp
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="mb-2 font-medium">Optional columns</p>
            <table className="w-full text-left">
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-1.5 pr-4 font-mono text-xs">tags</td>
                  <td className="py-1.5 text-muted-foreground">
                    Semicolon-separated, e.g. <span className="font-mono">food;travel</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground text-xs">Compatible with ExpenseOwl CSV exports.</p>
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={() => fileInputRef.current?.click()}>Choose File</Button>
        </DialogFooter>
        <input ref={fileInputRef} accept=".csv" className="hidden" type="file" onChange={handleFileChange} />
      </DialogContent>
    </Dialog>
  )
}
